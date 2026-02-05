/**
 * Self-Modify Reload Protocol
 *
 * Agent requests reload; supervisor executes it.
 * Agent does NOT restart itself directly.
 *
 * CONFIGURATION:
 * Via config:
 *   selfModify:
 *     reloadDelayMs: 500        # Delay before restart (default: 500)
 *     reloadBackoffMultiplier: 2  # Exponential backoff multiplier
 *     reloadMaxDelay: 10000      # Max delay between reloads (default: 10000)
 *
 * Via environment:
 *   OPENCLAW_SELF_MODIFY_RELOAD_DELAY_MS=500
 *   OPENCLAW_SELF_MODIFY_RELOAD_BACKOFF_MULTIPLIER=2
 *   OPENCLAW_SELF_MODIFY_RELOAD_MAX_DELAY=10000
 */

import { writeRestartSentinel } from "../../infra/restart-sentinel.js";
import {
  authorizeGatewaySigusr1Restart,
  scheduleGatewaySigusr1Restart,
} from "../../infra/restart.js";

export interface SelfModifyReloadRequest {
  reason: string;
  modifiedFiles: string[];
  rollbackCommit?: string;
  validationPassed: boolean;
}

// Reload configuration
export interface ReloadConfig {
  delayMs: number;
  backoffMultiplier: number;
  maxDelay: number;
}

const DEFAULT_CONFIG: ReloadConfig = {
  delayMs: 500,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// Environment overrides
function getReloadConfig(): Partial<ReloadConfig> {
  const config: Partial<ReloadConfig> = {};

  const delay = process.env.OPENCLAW_SELF_MODIFY_RELOAD_DELAY_MS;
  if (delay) {
    const parsed = parseInt(delay, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      config.delayMs = parsed;
    }
  }

  const multiplier = process.env.OPENCLAW_SELF_MODIFY_RELOAD_BACKOFF_MULTIPLIER;
  if (multiplier) {
    const parsed = parseFloat(multiplier);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      config.backoffMultiplier = parsed;
    }
  }

  const max = process.env.OPENCLAW_SELF_MODIFY_RELOAD_MAX_DELAY;
  if (max) {
    const parsed = parseInt(max, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      config.maxDelay = parsed;
    }
  }

  return config;
}

// Track consecutive reloads for backoff
let consecutiveReloads = 0;
let lastReloadTime = 0;

export async function requestSelfModifyReload(
  request: SelfModifyReloadRequest,
  config?: Partial<ReloadConfig>,
): Promise<{ scheduled: boolean; error?: string }> {
  if (!request.validationPassed) {
    return { scheduled: false, error: "Validation not passed" };
  }

  if (request.modifiedFiles.length === 0) {
    return { scheduled: false, error: "No files modified" };
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...getReloadConfig(), ...config };

  // Calculate backoff for consecutive reloads
  const now = Date.now();
  if (now - lastReloadTime < 5000) {
    consecutiveReloads++;
  } else {
    consecutiveReloads = 1;
  }
  lastReloadTime = now;

  // Exponential backoff
  const backoffDelay = Math.min(
    mergedConfig.delayMs * Math.pow(mergedConfig.backoffMultiplier, consecutiveReloads - 1),
    mergedConfig.maxDelay,
  );

  console.log(
    `[SelfModify] Reload scheduled (consecutive: ${consecutiveReloads}, delay: ${backoffDelay}ms)`,
  );

  // Write sentinel with rollback info
  await writeRestartSentinel({
    kind: "restart",
    status: "ok",
    ts: Date.now(),
    message: `Self-modify: ${request.reason}`,
    stats: {
      mode: "self-modify",
      before: {
        files: request.modifiedFiles,
        rollbackCommit: request.rollbackCommit,
      },
    },
  });

  // Run pre-reload hooks
  const hookErrors = await runPreReloadHooks();
  if (hookErrors.length > 0) {
    return { scheduled: false, error: `Pre-reload hooks failed: ${hookErrors.join(", ")}` };
  }

  // Authorize and schedule restart with backoff
  authorizeGatewaySigusr1Restart(backoffDelay);
  scheduleGatewaySigusr1Restart({
    delayMs: backoffDelay,
    reason: `self-modify: ${request.reason}`,
  });

  return { scheduled: true };
}

// ============================================================================
// Pre-Reload Validation Hooks
// ============================================================================

type PreReloadHook = () => Promise<{ ok: boolean; error?: string }>;
const preReloadHooks: PreReloadHook[] = [];

/**
 * Register a pre-reload validation hook.
 * Hooks run before reload and can block if they return { ok: false, error: "..." }.
 */
export function registerPreReloadHook(hook: PreReloadHook): void {
  preReloadHooks.push(hook);
}

/**
 * Run all pre-reload hooks.
 * Returns array of errors from failed hooks.
 */
async function runPreReloadHooks(): Promise<string[]> {
  const errors: string[] = [];

  for (const hook of preReloadHooks) {
    try {
      const result = await hook();
      if (!result.ok && result.error) {
        errors.push(result.error);
      }
    } catch (err) {
      errors.push(`Hook error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return errors;
}

/**
 * Clear all pre-reload hooks (for testing).
 */
export function clearPreReloadHooks(): void {
  preReloadHooks.length = 0;
}
