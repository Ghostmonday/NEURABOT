/**
 * Identity Extraction Extension
 *
 * Automatically extracts identity fragments from conversations and task outcomes.
 * Runs after each task completion to learn from user interactions.
 *
 * ⚠️ WRITE ACCESS RULE (NON-NEGOTIABLE):
 * Only this extension may write identity fragments to the store.
 * Other extensions and personas are READ-ONLY.
 */

import type { IdentityStore } from "../../identity/store.js";
import type { Task } from "../../mission-control/schema.js";
import type { ExecutorResult, ExtensionFoundation, ExtensionLifecycle } from "../integration.js";
import { getChildLogger } from "../../../logging/logger.js";
import {
  createIdentityExtractionPipeline,
  type IdentityExtractionPipeline,
} from "../../identity/extraction-pipeline.js";
import { redactError } from "../../security/redact.js";

const log = getChildLogger({ subsystem: "identity-extraction-extension" });

export class IdentityExtractionExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;
  private extractionPipeline: IdentityExtractionPipeline | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    // Get identity store with write access from foundation
    const identityStoreWithWrite = (
      foundation as {
        getIdentityStoreWithWrite?: () => IdentityStore | null;
      }
    ).getIdentityStoreWithWrite?.();

    if (!identityStoreWithWrite) {
      log.warn(
        "Identity extraction extension: No write-enabled identity store available. Extraction will be disabled.",
      );
      return;
    }

    // Create extraction pipeline
    this.extractionPipeline = await createIdentityExtractionPipeline(
      identityStoreWithWrite,
      process.env.IDENTITY_EXTRACTION_MODEL || "pattern-matching",
    );

    log.info("Identity extraction extension initialized");
  }

  async shutdown(): Promise<void> {
    this.extractionPipeline = null;
    this.foundation = null;
    log.info("Identity extraction extension shut down");
  }

  async tick(): Promise<void> {
    // Periodic work could include:
    // - Batch processing of queued conversations
    // - Re-extraction with updated models
    // - Cleanup of low-confidence fragments
  }

  /**
   * Extract identity from a completed task.
   * Called by the scheduler after task completion.
   */
  async extractFromTask(
    task: Task,
    result: ExecutorResult | { outcome: string; summary: string; confidence?: number },
  ): Promise<void> {
    if (!this.extractionPipeline) {
      return;
    }

    try {
      await this.extractionPipeline.extractFromTaskOutcome({
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        outcome: result.outcome,
        summary: result.summary || "",
        category: task.category,
      });
    } catch (error) {
      // Don't fail task completion if extraction fails
      log.warn("Failed to extract identity from task", {
        taskId: task.taskId,
        error: redactError(error),
      });
    }
  }
}
