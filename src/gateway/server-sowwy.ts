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
import { ExtensionFoundationImpl } from "../sowwy/extensions/foundation.js";
import { ExtensionLoader } from "../sowwy/extensions/loader.js";
import {
  createInMemoryStores,
  createLanceDBIdentityStore,
  createPostgresStores,
  PersonaOwner,
  registerSowwyRPCMethods,
  SMTThrottler,
  TaskScheduler,
  type GatewayContext,
  type SowwyStores,
  type Task,
  type TaskExecutionResult,
} from "../sowwy/index.js";
import { validateSowwyEnv } from "../sowwy/security/env-validator.js";
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
}

/**
 * Bootstrap Sowwy: create stores, identity store, SMT, RPC handlers, and optional scheduler.
 * If SOWWY_POSTGRES_HOST is not set, returns no-op handlers and null scheduler.
 *
 * Validates all environment variables and redacts secrets from errors.
 */
export async function bootstrapSowwy(): Promise<SowwyBootstrapResult> {
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
    console.warn("⚠️ Using In-Memory Store (Data will be lost on restart)");
    stores = createInMemoryStores();
  } else {
    stores = await createPostgresStores(env.postgres!);
  }

  const stubEmbedder = createStubEmbeddingProvider(384);
  const identityStore = await createLanceDBIdentityStore({
    dbPath: env.identityPath,
    embeddingProvider: stubEmbedder,
    writeAccessAllowed: false,
  });

  const smt = new SMTThrottler({
    windowMs: env.smt.windowMs,
    maxPrompts: env.smt.maxPrompts,
    targetUtilization: env.smt.targetUtilization,
    reservePercent: env.smt.reservePercent,
  });

  const context: GatewayContext = {
    stores,
    identityStore,
    smt,
    userId: "gateway",
  };

  const rpcMethods = registerSowwyRPCMethods(context);

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

  const scheduler = new TaskScheduler(stores.tasks, identityStore, smt, {
    pollIntervalMs: env.scheduler.pollIntervalMs,
    maxRetries: env.scheduler.maxRetries,
    stuckTaskThresholdMs: env.scheduler.stuckTaskThresholdMs,
  });

  const personaStub = async (_task: Task, _context: string): Promise<TaskExecutionResult> => ({
    success: true,
    outcome: "COMPLETED",
    summary: "Stub executor (register real persona executors)",
    confidence: 0,
  });

  scheduler.registerPersona(PersonaOwner.Dev, personaStub);
  scheduler.registerPersona(PersonaOwner.LegalOps, personaStub);
  scheduler.registerPersona(PersonaOwner.ChiefOfStaff, personaStub);
  scheduler.registerPersona(PersonaOwner.RnD, personaStub);

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
  };
}
