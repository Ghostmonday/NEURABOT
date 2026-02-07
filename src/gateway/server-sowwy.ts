/**
 * Sowwy Gateway Integration
 *
 * Bootstraps Mission Control (pg-store), Identity (lancedb-store), SMT, and
 * registers Sowwy RPC methods with the gateway. Optionally starts the task scheduler.
 */

import type {
  GatewayRequestHandler,
  GatewayRequestHandlerOptions,
} from "./server-methods/types.js";
import { loadConfig } from "../config/config.js";
import { getChildLogger } from "../logging/logger.js";
import { createEmbeddingProvider } from "../memory/embeddings.js";
import { ExtensionFoundationImpl } from "../sowwy/extensions/foundation.js";
import { ExtensionLoader } from "../sowwy/extensions/loader.js";
import { adaptMemoryEmbeddingProvider } from "../sowwy/identity/embedding-adapter.js";
import {
  createInMemoryStores,
  createLanceDBIdentityStore,
  createPostgresStores,
  PersonaOwner,
  registerSowwyRPCMethods,
  SMTThrottler,
  TaskScheduler,
  type GatewayContext,
  type IdentityStore,
  type SowwyStores,
  type Task,
  type TaskExecutionResult,
} from "../sowwy/index.js";
import { validateSowwyEnv } from "../sowwy/security/env-validator.js";
import { redactError } from "../sowwy/security/redact.js";
import { redactString } from "../sowwy/security/redact.js";
import { startWatchdog } from "../watchdog/heartbeat.js";
import { ErrorCodes, errorShape } from "./protocol/index.js";

const SOWWY_METHODS = [
  "tasks.list",
  "tasks.create",
  "tasks.update",
  "tasks.get",
  "tasks.nextReady",
  "tasks.approve",
  "tasks.complete",
  "tasks.cancel",
  "tasks.audit",
  "tasks.decisions",
  "sowwy.status",
  "sowwy.pause",
  "sowwy.resume",
  "identity.search",
  "identity.stats",
  "sowwy.metrics",
  "sowwy.health",
  "sowwy.capabilities",
] as const;

/** Stub embedding provider for bootstrap when no embedder is configured (returns zero vector). */
function createStubEmbeddingProvider(dimensions = 384): {
  embed: (text: string) => Promise<number[]>;
  getDimensions: () => number;
} {
  const zero = Array.from({ length: dimensions }, () => 0);
  return {
    embed: async () => zero,
    getDimensions: () => dimensions,
  };
}

/**
 * Create real embedding provider for identity store from config/env vars.
 * Falls back to stub if provider is not configured or fails to initialize.
 */
async function createIdentityEmbeddingProvider(): Promise<{
  embed: (text: string) => Promise<number[]>;
  getDimensions: () => number;
}> {
  const log = getChildLogger({ subsystem: "gateway-sowwy-identity" });
  const providerType = process.env.SOWWY_IDENTITY_EMBEDDING_PROVIDER || "auto";

  // If explicitly set to "stub", use stub
  if (providerType === "stub") {
    return createStubEmbeddingProvider(384);
  }

  try {
    const cfg = loadConfig();
    const provider =
      providerType === "auto" ? "auto" : (providerType as "openai" | "gemini" | "local");

    // Determine model based on provider
    let model = "text-embedding-3-small"; // OpenAI default
    if (provider === "gemini") {
      model = "text-embedding-004";
    } else if (provider === "local") {
      model = "hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf";
    }

    const result = await createEmbeddingProvider({
      config: cfg,
      provider,
      model,
      fallback: "none",
      remote: undefined,
      local: undefined,
    });

    // Get dimensions from the provider
    // OpenAI text-embedding-3-small = 1536, Gemini = 768, Local varies
    let dimensions = 1536; // Default for OpenAI
    if (provider === "gemini" || result.requestedProvider === "gemini") {
      dimensions = 768;
    } else if (provider === "local" || result.requestedProvider === "local") {
      // Local models vary, but embeddinggemma-300M is typically 768
      dimensions = 768;
    }

    // Adapt memory provider to identity store interface
    return adaptMemoryEmbeddingProvider(result.provider, dimensions);
  } catch (error) {
    log.warn(
      `⚠️ Failed to initialize identity embedding provider (${providerType}): ${error instanceof Error ? error.message : String(error)}. Falling back to stub embedder.`,
    );
    return createStubEmbeddingProvider(384);
  }
}

function getUserId(_opts: GatewayRequestHandlerOptions): string {
  // Gateway context doesn't expose sessionKey/identity in connect params
  // Use a default user ID for gateway-initiated requests
  return "gateway";
}

/** Build params-derived args for each Sowwy RPC method. */
function argsFor(method: string, params: Record<string, unknown>): unknown[] {
  switch (method) {
    case "tasks.list":
      return [params.filter];
    case "tasks.create":
      return [params];
    case "tasks.update":
      return [params.taskId, params.input];
    case "tasks.get":
    case "tasks.audit":
    case "tasks.decisions":
      return [params.taskId];
    case "tasks.nextReady":
    case "sowwy.status":
    case "sowwy.resume":
    case "identity.stats":
    case "sowwy.metrics":
    case "sowwy.health":
      return [];
    case "tasks.approve":
      return [params.taskId];
    case "tasks.complete":
      return [params.taskId, params.outcome, params.summary, params.confidence];
    case "tasks.cancel":
      return [params.taskId, params.reason];
    case "sowwy.pause":
      return [params.reason ?? ""];
    case "identity.search":
      return [params.query, params.options];
    default:
      return [params];
  }
}

export interface SowwyBootstrapResult {
  sowwyHandlers: Record<string, GatewayRequestHandler>;
  sowwyMethodNames: string[];
  scheduler: TaskScheduler | null;
  stores: SowwyStores | null;
  identityStore: IdentityStore | null;
  smt: SMTThrottler | null;
}

/**
 * Bootstrap Sowwy: create stores, identity store, SMT, RPC handlers, and optional scheduler.
 * If SOWWY_POSTGRES_HOST is not set, returns no-op handlers and null scheduler.
 *
 * Validates all environment variables and redacts secrets from errors.
 */
export async function bootstrapSowwy(): Promise<SowwyBootstrapResult> {
  const log = getChildLogger({ subsystem: "gateway-sowwy" });
  // NOTE: Watchdog starts here. If you see "[Watchdog] Watchdog system started" in logs,
  // the heartbeat is active. Configure HEALTHCHECKS_URL in ecosystem.config.cjs for
  // external "Dead Man's Switch" monitoring.
  startWatchdog();

  // Validate environment variables (fails fast with clear errors)
  let env: ReturnType<typeof validateSowwyEnv>;
  try {
    env = validateSowwyEnv();
  } catch (error) {
    // Redact any secrets that might have leaked into error message
    throw new Error(redactString(error instanceof Error ? error.message : String(error)), {
      cause: error,
    });
  }

  const pgHost = env.postgres?.host;
  let stores: SowwyStores;

  if (!pgHost || process.env.SOWWY_DB_TYPE === "memory") {
    log.warn("⚠️ Using In-Memory Store (Data will be lost on restart)");
    stores = createInMemoryStores();
  } else {
    stores = await createPostgresStores(env.postgres!);
  }

  const embeddingProvider = await createIdentityEmbeddingProvider();
  const identityStore = await createLanceDBIdentityStore({
    dbPath: env.identityPath,
    embeddingProvider,
    writeAccessAllowed: false,
  });

  const smt = new SMTThrottler({
    windowMs: env.smt.windowMs,
    maxPrompts: env.smt.maxPrompts,
    targetUtilization: env.smt.targetUtilization,
    reservePercent: env.smt.reservePercent,
  });

  // Kill switch is intentionally NOT auto-applied at startup.
  // Only the explicit sowwy.pause RPC command should pause the system.
  // SOWWY_KILL_SWITCH in .env is a flag for the RPC handler, not an auto-pause.
  // This ensures continuous operation unless explicitly stopped by the user.

  const scheduler = new TaskScheduler(
    stores.tasks,
    identityStore,
    smt,
    {
      pollIntervalMs: env.scheduler.pollIntervalMs,
      maxRetries: env.scheduler.maxRetries,
      stuckTaskThresholdMs: env.scheduler.stuckTaskThresholdMs,
      maxConcurrentPerPersona: env.scheduler.maxConcurrentPerPersona,
    },
    stores.audit,
  );

  const context: GatewayContext = {
    stores,
    identityStore,
    smt,
    scheduler,
    userId: "gateway",
  };

  const rpcMethods = registerSowwyRPCMethods(context);

  // Initialize metrics collector with history path
  try {
    const { getGlobalCollector } = await import("../sowwy/monitoring/collector.js");
    const { resolveStateDir } = await import("../config/paths.js");
    const { join } = await import("node:path");
    const stateDir = resolveStateDir(process.env);
    const metricsHistoryPath = join(stateDir, "workspace", "data", "metrics-history.jsonl");
    const collector = getGlobalCollector();
    if ("setMetricsHistoryPath" in collector) {
      (collector as { setMetricsHistoryPath(path: string): void }).setMetricsHistoryPath(
        metricsHistoryPath,
      );
    }
  } catch (err) {
    log.warn("Failed to initialize metrics collector", { error: redactError(err) });
  }

  // Initialize system awareness - log capabilities to audit store
  try {
    const { initializeSystemAwareness } = await import("../sowwy/identity/system-awareness.js");
    const capabilitiesMethod = rpcMethods["sowwy.capabilities"];
    if (capabilitiesMethod && typeof capabilitiesMethod === "function") {
      const capabilities = await capabilitiesMethod();
      await initializeSystemAwareness(stores.audit, capabilities);
      log.info("Bot capabilities logged to audit store");
    } else {
      log.warn("sowwy.capabilities RPC method not available");
    }
  } catch (err) {
    log.warn("Failed to initialize system awareness", { error: redactError(err) });
  }

  const sowwyHandlers: Record<string, GatewayRequestHandler> = {};
  for (const method of SOWWY_METHODS) {
    const fn = rpcMethods[method];
    if (!fn) {
      continue;
    }
    sowwyHandlers[method] = async (opts) => {
      const userId = getUserId(opts);
      const ctxWithUser: GatewayContext = { ...context, userId };
      const methodsWithUser = registerSowwyRPCMethods(ctxWithUser);
      const handler = methodsWithUser[method];
      if (!handler) {
        opts.respond(
          false,
          undefined,
          errorShape(ErrorCodes.INVALID_REQUEST, `unknown method: ${method}`),
        );
        return;
      }
      try {
        const params = opts.params ?? {};
        const args = argsFor(method, params);
        const result = await (handler as (...a: unknown[]) => Promise<unknown>)(...args);
        opts.respond(true, result);
      } catch (err) {
        const message = redactString(err instanceof Error ? err.message : String(err));
        opts.respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, message));
      }
    };
  }

  // Persona executors are registered by extensions (PersonaDevExtension, etc.)
  // No stub registrations needed - extensions will register real executors

  // Wire Extensions
  const foundation = new ExtensionFoundationImpl(
    scheduler,
    smt,
    identityStore,
    stores.tasks,
    stores.audit,
  );
  const loader = new ExtensionLoader(foundation);
  await loader.load();

  return {
    sowwyHandlers,
    sowwyMethodNames: [...SOWWY_METHODS],
    scheduler,
    stores,
    identityStore,
    smt,
  };
}
