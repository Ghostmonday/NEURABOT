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

// TODO: Make rollback config configurable via selfModify.rollback config section. Allow
// per-environment tuning: healthCheckTimeoutMs (default 30000), maxConsecutiveFailures
// (default 2), rollbackStrategy ('file-scoped' | 'full-checkout' | 'git-reset').
// TODO: Tune rollback config based on reliability formula. Default healthCheckTimeoutMs:
// 30000 (30s) should allow for recovery time < T_max. Default maxConsecutiveFailures: 2
// should catch health probe failures. Make configurable per deployment environment.
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
  // TODO: Add rollback strategy selection. Support 'file-scoped' (current), 'full-checkout'
  // (git checkout <commit>), and 'git-reset' (git reset --hard). Add dry-run mode to preview
  // rollback changes. Log rollback operations to audit trail.
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

// TODO: Enhance health check to probe multiple endpoints: gateway health, channel
// connectivity, model availability. Add configurable health check endpoints:
// selfModify.healthCheck.endpoints array. Implement exponential backoff for health probes.
// Add support for custom health check scripts via selfModify.healthCheck.script.
// TODO: Implement reliability formula: R = P(health probe success | new config) ×
// P(recovery time < T_max). Track health probe success rate over time. Measure recovery
// time distribution. Use formula to tune healthCheckTimeoutMs and maxConsecutiveFailures.
// Add reliability metrics to health snapshot.
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
