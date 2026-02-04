/**
 * Self-Modify Reload Protocol
 *
 * Agent requests reload; supervisor executes it.
 * Agent does NOT restart itself directly.
 */

import { writeRestartSentinel } from "../../infra/restart-sentinel.js";
import {
  authorizeGatewaySigusr1Restart,
  scheduleGatewaySigusr1Restart,
} from "../../infra/restart.js";

export interface SelfModifyReloadRequest {
  reason: string;
  modifiedFiles: string[];
  rollbackCommit?: string; // Git commit to revert to on failure
  validationPassed: boolean;
}

export async function requestSelfModifyReload(
  request: SelfModifyReloadRequest,
): Promise<{ scheduled: boolean; error?: string }> {
  if (!request.validationPassed) {
    return { scheduled: false, error: "Validation not passed" };
  }

  if (request.modifiedFiles.length === 0) {
    return { scheduled: false, error: "No files modified" };
  }

  // Write sentinel with rollback info
  // Use "restart" kind and put self-modify details in message/stats
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

  // Authorize and schedule restart
  authorizeGatewaySigusr1Restart(500); // 500ms delay for cleanup
  scheduleGatewaySigusr1Restart({
    delayMs: 500,
    reason: `self-modify: ${request.reason}`,
  });

  return { scheduled: true };
}
