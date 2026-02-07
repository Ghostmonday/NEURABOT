/**
 * Roadmap Observer Extension
 *
 * Monitors README.md Section 12 and autonomously creates sub-tasks to drive
 * completion of Track 1 (iOS), Track 2 (Tuta Mail), and Track 3 (Calendar).
 *
 * Constitutional Compliance (README §0):
 * - The Goal (§12): Reads roadmap tracks from README
 * - The Brain (§6): Creates and manages sub-tasks via SOWWY
 * - The Hands (§5): Sub-tasks executed by Dev/ChiefOfStaff executors
 * - The Safety Net (§8-9): Approval gates, SMT throttle, audit logging
 *
 * FITNESS ASSESSMENT INTEGRATION (README §0.4 - MANDATORY FIRMWARE):
 * This extension MUST create fitness assessment tasks for all modules.
 * TODO: Add fitness assessment task creation alongside roadmap sub-tasks.
 */

import fs from "node:fs";
import path from "node:path";
import type { Task } from "../../mission-control/schema.js";
import type {
  ExecutorResult,
  ExtensionFoundation,
  ExtensionLifecycle,
  PersonaExecutor,
} from "../integration.js";
import { getChildLogger } from "../../../logging/logger.js";
import { redactError } from "../../security/redact.js";
import { parseRoadmap, type Track } from "./parser.js";

const MAX_SUBTASKS_PER_EXECUTION = process.env.SOWWY_FAST_MODE === "true" ? 20 : 10;
const FOLLOW_UP_INTERVAL_MS =
  process.env.SOWWY_FAST_MODE === "true" ? 15 * 60 * 1000 : 60 * 60 * 1000; // 15 min fast vs 1 hour
const README_PATH = path.join(process.cwd(), "README.md");

const log = getChildLogger({ subsystem: "roadmap-observer" });

export class RoadmapObserverExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    // Register the ChiefOfStaff executor for MISSION_CONTROL tasks
    const executor = new RoadmapObserverExecutor(foundation);
    foundation.registerPersonaExecutor("ChiefOfStaff", executor);

    log.info("Extension initialized");
  }

  async shutdown(): Promise<void> {
    log.info("Extension shutting down");
  }

  async tick(): Promise<void> {
    // Optional periodic work - main work happens via task execution
  }
}

class RoadmapObserverExecutor implements PersonaExecutor {
  persona = "ChiefOfStaff";
  private readonly log = getChildLogger({ subsystem: "roadmap-observer" });

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return task.category === "MISSION_CONTROL" && task.payload?.action === "read_readme_roadmap";
  }

  async execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: { action: string; details: unknown }): Promise<void> };
      logger: {
        info(msg: string, meta?: Record<string, unknown>): void;
        warn(msg: string, meta?: Record<string, unknown>): void;
        error(msg: string, meta?: Record<string, unknown>): void;
      };
    },
  ): Promise<ExecutorResult> {
    try {
      // Check SMT quota before proceeding
      if (!this.foundation.canProceed("roadmap_observer.parse")) {
        return {
          success: false,
          outcome: "SMT_THROTTLED",
          summary: "SMT throttler blocked execution. Will retry later.",
          confidence: 1.0,
          error: "SMT quota exceeded",
        };
      }

      context.smt.recordUsage("roadmap_observer.parse");

      // Ensure README.md exists
      if (!fs.existsSync(README_PATH)) {
        return {
          success: false,
          outcome: "READ_ERROR",
          summary: `README.md not found at ${README_PATH}`,
          confidence: 1.0,
          error: "File not found",
        };
      }

      // Read README.md
      let readmeContent: string;
      try {
        readmeContent = fs.readFileSync(README_PATH, "utf-8");
      } catch (err) {
        this.log.error("Failed to read README.md", { error: redactError(err) });
        return {
          success: false,
          outcome: "READ_ERROR",
          summary: `Failed to read README.md: ${err instanceof Error ? err.message : String(err)}`,
          confidence: 1.0,
          error: String(err),
        };
      }

      // Parse roadmap
      const roadmap = parseRoadmap(readmeContent);
      if (!roadmap) {
        return {
          success: false,
          outcome: "PARSE_ERROR",
          summary: "Failed to parse README.md Section 12 (Where to Go from Here)",
          confidence: 1.0,
          error: "Section 12 not found",
        };
      }

      await context.audit.log({
        action: "roadmap_parsed",
        details: {
          tracksFound: roadmap.tracks.length,
          tracks: roadmap.tracks.map((t) => ({ id: t.id, status: t.status })),
        },
      });

      // Create sub-tasks for incomplete tracks
      const taskStore = this.foundation.getTaskStore();
      let subtasksCreated = 0;
      const trackStatuses: string[] = [];

      for (const track of roadmap.tracks) {
        trackStatuses.push(`${track.name}: ${track.status}`);

        if (track.status === "COMPLETED") {
          continue; // Skip completed tracks
        }

        // Limit sub-task creation to prevent runaway
        if (subtasksCreated >= MAX_SUBTASKS_PER_EXECUTION) {
          await context.audit.log({
            action: "subtask_limit_reached",
            details: { limit: MAX_SUBTASKS_PER_EXECUTION },
          });
          break;
        }

        // Note: We can't query tasks by category/persona via foundation API.
        // We'll create the task and rely on the scheduler to avoid duplicates
        // by checking task status. If a task for this track already exists
        // and is IN_PROGRESS/READY, the scheduler won't pick up duplicates.
        // For now, we create optimistically and let the system handle it.

        // Create sub-task for incomplete track
        try {
          await this.createSubTask(task, track, taskStore, context);
          subtasksCreated++;
        } catch (err) {
          this.log.warn("Subtask creation failed", { trackId: track.id, error: redactError(err) });
          await context.audit.log({
            action: "subtask_creation_failed",
            details: {
              trackId: track.id,
              error: err instanceof Error ? err.message : String(err),
            },
          });
          // Continue to next track
        }
      }

      // Check if we should persist (create follow-up task)
      const persistUntilComplete = task.payload?.persist_until_complete === true;
      const allTracksComplete = roadmap.tracks.every((t) => t.status === "COMPLETED");

      if (persistUntilComplete && !allTracksComplete) {
        // Create follow-up MISSION_CONTROL task for next check (15 min in fast mode, else 1 hour)
        const nextCheckAt = new Date(Date.now() + FOLLOW_UP_INTERVAL_MS);

        await taskStore.create({
          title: "Monitor README Roadmap Progress",
          description:
            "Continuously monitor Section 12 roadmap and create sub-tasks for incomplete tracks",
          category: "MISSION_CONTROL",
          personaOwner: "ChiefOfStaff",
          urgency: 5,
          importance: 5,
          risk: 2,
          stressCost: 2,
          requiresApproval: false,
          maxRetries: 3,
          dependencies: [task.taskId],
          contextLinks: {},
          payload: {
            action: "read_readme_roadmap",
            persist_until_complete: true,
          },
          createdBy: "roadmap-observer",
        });

        await context.audit.log({
          action: "followup_task_created",
          details: { scheduledFor: nextCheckAt, intervalMs: FOLLOW_UP_INTERVAL_MS },
        });
      }

      return {
        success: true,
        outcome: allTracksComplete ? "ROADMAP_COMPLETE" : "ROADMAP_MONITORED",
        summary: `Parsed README §12. ${trackStatuses.join(", ")}. Created ${subtasksCreated} sub-tasks.${allTracksComplete ? " All tracks complete!" : ""}`,
        confidence: 0.9,
      };
    } catch (err) {
      this.log.error("Roadmap observer execution failed", { error: redactError(err) });
      return {
        success: false,
        outcome: "EXECUTION_ERROR",
        summary: `Roadmap observer failed: ${err instanceof Error ? err.message : String(err)}`,
        confidence: 0.5,
        error: String(err),
      };
    }
  }

  private async createSubTask(
    parentTask: Task,
    track: Track,
    taskStore: ReturnType<ExtensionFoundation["getTaskStore"]>,
    context: { audit: { log(entry: { action: string; details: unknown }): Promise<void> } },
  ): Promise<void> {
    // Map track to category and persona
    const category = track.id.includes("ios") ? "DEV" : "ADMIN";
    const persona = track.id.includes("ios") ? "Dev" : "ChiefOfStaff";

    // Determine if any phase requires approval
    const requiresApproval = track.phases.some((p) => p.requiresApproval);

    // Create sub-task
    await taskStore.create({
      title: `${track.name}`,
      description: `Track from README §12. Current status: ${track.status}. ${track.phases.length} phases identified.`,
      category,
      personaOwner: persona,
      urgency: 4,
      importance: 4,
      risk: requiresApproval ? 3 : 2,
      stressCost: 3,
      requiresApproval,
      maxRetries: 3,
      dependencies: [parentTask.taskId],
      contextLinks: {
        readme: "README.md#where-to-go-from-here",
      },
      payload: {
        trackId: track.id,
        trackName: track.name,
        phases: track.phases,
        source: "roadmap-observer",
      },
      createdBy: "roadmap-observer",
    });

    await context.audit.log({
      action: "subtask_created",
      details: {
        trackId: track.id,
        category,
        persona,
        requiresApproval,
      },
    });
  }
}
