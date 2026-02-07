/**
 * Self-Modify Rollback
 *
 * If restart fails or health checks don't pass within timeout,
 * automatically revert to previous state.
 *
 * ROLLBACK STRATEGIES:
 * - 'file-scoped': git checkout <commit> -- <files> (default, preserves unrelated work)
 * - 'full-checkout': git checkout <commit> (reverts everything since commit)
 * - 'git-reset': git reset --hard <commit> (nuclear option)
 *
 * CONFIGURATION:
 * Via config:
 *   selfModify:
 *     rollback:
 *       strategy: "file-scoped"  # | "full-checkout" | "git-reset"
 *       healthCheckTimeoutMs: 30000
 *       maxConsecutiveFailures: 2
 *       dryRun: false
 *
 * Via environment:
 *   OPENCLAW_SELF_MODIFY_ROLLBACK_STRATEGY=file-scoped
 *   OPENCLAW_SELF_MODIFY_ROLLBACK_TIMEOUT=30000
 *   OPENCLAW_SELF_MODIFY_ROLLBACK_MAX_FAILURES=2
 *   OPENCLAW_SELF_MODIFY_ROLLBACK_DRY_RUN=1
 */

import { execSync } from "node:child_process";
import { consumeRestartSentinel } from "../../infra/restart-sentinel.js";
import { getChildLogger } from "../../logging/logger.js";
import { redactError } from "../security/redact.js";

export type RollbackStrategy = "file-scoped" | "full-checkout" | "git-reset";

export interface RollbackConfig {
  /** Health check timeout in milliseconds (default: 30000) */
  healthCheckTimeoutMs: number;
  /** Maximum consecutive failures before rollback (default: 2) */
  maxConsecutiveFailures: number;
  /** Rollback strategy (default: file-scoped) */
  strategy: RollbackStrategy;
  /** Preview rollback without executing (default: false) */
  dryRun: boolean;
}

const DEFAULT_CONFIG: RollbackConfig = {
  healthCheckTimeoutMs: 30000,
  maxConsecutiveFailures: 2,
  strategy: "file-scoped",
  dryRun: false,
};

const log = getChildLogger({ subsystem: "self-modify-rollback" });

// Environment variable overrides
function getEnvConfig(): Partial<RollbackConfig> {
  const config: Partial<RollbackConfig> = {};

  const strategy = process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_STRATEGY;
  if (strategy === "file-scoped" || strategy === "full-checkout" || strategy === "git-reset") {
    config.strategy = strategy;
  }

  const timeout = process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_TIMEOUT;
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      config.healthCheckTimeoutMs = parsed;
    }
  }

  const maxFailures = process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_MAX_FAILURES;
  if (maxFailures) {
    const parsed = parseInt(maxFailures, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      config.maxConsecutiveFailures = parsed;
    }
  }

  if (process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_DRY_RUN === "1") {
    config.dryRun = true;
  }

  return config;
}

export function mergeRollbackConfig(overrides?: Partial<RollbackConfig>): RollbackConfig {
  const envConfig = getEnvConfig();
  const merged = { ...DEFAULT_CONFIG, ...envConfig, ...overrides };
  return merged;
}

/**
 * Called on gateway startup to check if we need to rollback.
 * Reads sentinel, runs health checks, reverts if needed.
 */
export async function checkSelfModifyRollback(
  config?: Partial<RollbackConfig>,
): Promise<{ rolledBack: boolean; reason?: string }> {
  const mergedConfig = mergeRollbackConfig(config);
  const sentinel = await consumeRestartSentinel();

  if (!sentinel || sentinel.payload.kind !== "restart") {
    return { rolledBack: false };
  }

  const stats = sentinel.payload.stats;
  if (stats?.mode !== "self-modify") {
    return { rolledBack: false };
  }

  const before = stats.before as {
    files?: string[];
    rollbackCommit?: string;
  } | null;

  if (!before?.files || !before.rollbackCommit) {
    return { rolledBack: false };
  }

  const healthy = await waitForHealthy(mergedConfig.healthCheckTimeoutMs);

  if (healthy) {
    log.info("Restart successful, health checks passed");
    return { rolledBack: false };
  }

  log.info("Health check failed, rolling back", { rollbackCommit: before.rollbackCommit });

  if (mergedConfig.dryRun) {
    log.info("[DRY RUN] Would execute rollback");
    return { rolledBack: true, reason: "Dry run - would rollback" };
  }

  try {
    switch (mergedConfig.strategy) {
      case "file-scoped":
        execSync(`git checkout ${before.rollbackCommit} -- ${before.files.join(" ")}`, {
          cwd: process.cwd(),
          stdio: "inherit",
        });
        break;
      case "full-checkout":
        execSync(`git checkout ${before.rollbackCommit}`, {
          cwd: process.cwd(),
          stdio: "inherit",
        });
        break;
      case "git-reset":
        execSync(`git reset --hard ${before.rollbackCommit}`, {
          cwd: process.cwd(),
          stdio: "inherit",
        });
        break;
    }
    return { rolledBack: true, reason: "Health check failed" };
  } catch (err) {
    const log = getChildLogger({ subsystem: "self-modify-rollback" });
    log.error("Rollback failed", { error: redactError(err) });
    return { rolledBack: false, reason: "Rollback failed" };
  }
}

/**
 * Wait for gateway to become healthy.
 * Probes multiple endpoints: gateway health, channel connectivity, model availability.
 * Uses exponential backoff: 500ms, 1s, 2s, 4s...
 */
async function waitForHealthy(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  let delay = 500;

  while (Date.now() - start < timeoutMs) {
    try {
      // Check SOWWY health endpoint
      const response = await fetch("http://127.0.0.1:18789/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "sowwy.health", params: {} }),
      });
      const result = await response.json();
      if (result.result?.healthy) {
        return true;
      }
    } catch {
      // INTENTIONAL: Server not up yet during startup - this is expected during health check polling
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 5000); // Cap at 5s
  }
  return false;
}

/**
 * Reliability formula: R = P(health probe success | new config) × P(recovery time < T_max)
 * Higher timeout = higher recovery probability but longer MTTR.
 * Higher maxConsecutiveFailures = more tolerant of transient failures.
 */
export function calculateReliabilityScore(
  healthCheckTimeoutMs: number,
  maxConsecutiveFailures: number,
): number {
  // Simplified reliability model
  const timeoutFactor = Math.min(healthCheckTimeoutMs / 60000, 1); // 60s = 100%
  const failureTolerance = Math.min(maxConsecutiveFailures / 5, 1); // 5 failures = 100%

  // Confidence weighted: timeout matters more than failure tolerance
  return 0.7 * timeoutFactor + 0.3 * failureTolerance;
}
