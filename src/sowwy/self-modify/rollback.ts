/**
 * Self-Modify Rollback
 *
 * If restart fails or health checks don't pass within timeout,
 * automatically revert to previous state.
 *
 * STRATEGY: File-scoped rollback (git checkout <commit> -- <files>)
 * - Reverts only the files that were modified
 * - Preserves unrelated work from other agents/humans
 * - Requires sentinel to track which files were changed
 */

import { execSync } from "node:child_process";
import { consumeRestartSentinel } from "../../infra/restart-sentinel.js";

export interface RollbackConfig {
  healthCheckTimeoutMs: number; // Default: 30000 (30s)
  maxConsecutiveFailures: number; // Default: 2
}

const DEFAULT_CONFIG: RollbackConfig = {
  healthCheckTimeoutMs: 30000,
  maxConsecutiveFailures: 2,
};

/**
 * Called on gateway startup to check if we need to rollback.
 * Reads sentinel, runs health checks, reverts if needed.
 */
export async function checkSelfModifyRollback(
  config: RollbackConfig = DEFAULT_CONFIG,
): Promise<{ rolledBack: boolean; reason?: string }> {
  const sentinel = await consumeRestartSentinel();

  if (!sentinel || sentinel.payload.kind !== "restart") {
    return { rolledBack: false };
  }

  // Check if this is a self-modify restart
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

  // Wait for health checks
  const healthy = await waitForHealthy(config.healthCheckTimeoutMs);

  if (healthy) {
    console.log("[SelfModify] Restart successful, health checks passed");
    return { rolledBack: false };
  }

  // Health check failed - rollback
  console.log(`[SelfModify] Rolling back to ${before.rollbackCommit}`);
  try {
    execSync(`git checkout ${before.rollbackCommit} -- ${before.files.join(" ")}`, {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    return { rolledBack: true, reason: "Health check failed" };
  } catch (err) {
    console.error("[SelfModify] Rollback failed:", err);
    return { rolledBack: false, reason: "Rollback failed" };
  }
}

async function waitForHealthy(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
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
      // Server not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}
