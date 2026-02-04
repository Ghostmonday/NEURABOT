/**
 * Sowwy Mission Control - Scheduler Foundation
 *
 * ⚠️ PERFORMANCE CRITICAL: This scheduler runs continuously.
 * - Single-threaded initially - keep it that way until proven stable
 * - pollIntervalMs controls how often we check for new tasks
 * - If tasks pile up, increase pollIntervalMs, don't decrease it
 *
 * ⚠️ SAFETY CRITICAL: Never skip these checks:
 * 1. SMT.canProceed() - prevents runaway execution
 * 2. Task approval check - humans must approve sensitive tasks
 * 3. Identity context injection - personas need context
 *
 * ⚠️ RESILIENCE:
 * - Backoff grows exponentially: 5s, 10s, 20s... prevents thundering herd
 * - Max retries prevents infinite loops
 * - Stuck detection catches tasks that hang
 *
 * ⚠️ ORDERING GUARANTEE:
 * - Tasks are picked by priority score (calculatePriority)
 * - In ties, use createdAt for FIFO
 * - Never execute two tasks concurrently in the same persona
 */

import type { IdentityStore } from "../identity/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import type { TaskStore } from "./store.js";
import { redactError, redactString } from "../security/redact.js";
import { Task, PersonaOwner, TaskStatus } from "./schema.js";

// ============================================================================
// Scheduler Config
// ============================================================================

export interface SchedulerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  stuckTaskThresholdMs: number;
  backoffBaseMs: number;
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  pollIntervalMs: 5000, // Check every 5 seconds
  maxRetries: 3, // Max retries per task
  stuckTaskThresholdMs: 3600000, // 1 hour = stuck
  backoffBaseMs: 5000, // Base backoff: 5s, 10s, 20s...
};

// ============================================================================
// Scheduler State
// ============================================================================

export interface SchedulerState {
  running: boolean;
  lastTaskAt: Date | null;
  tasksProcessed: number;
  tasksFailed: number;
}

// ============================================================================
// Task Execution Result
// ============================================================================

export interface TaskExecutionResult {
  success: boolean;
  outcome: string;
  summary: string;
  confidence: number;
  error?: string;
}

// ============================================================================
// Scheduler Class
// ============================================================================

export class TaskScheduler {
  private config: SchedulerConfig;
  private state: SchedulerState;
  private taskStore: TaskStore;
  private identityStore: IdentityStore;
  private smt: SMTThrottler;
  private personaExecutors: Map<
    string,
    (task: Task, context: string) => Promise<TaskExecutionResult>
  >;

  constructor(
    taskStore: TaskStore,
    identityStore: IdentityStore,
    smt: SMTThrottler,
    config: Partial<SchedulerConfig> = {},
  ) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.state = {
      running: false,
      lastTaskAt: null,
      tasksProcessed: 0,
      tasksFailed: 0,
    };
    this.taskStore = taskStore;
    this.identityStore = identityStore;
    this.smt = smt;
    this.personaExecutors = new Map();
  }

  /**
   * Register a persona executor
   */
  registerPersona(
    persona: PersonaOwner,
    executor: (task: Task, context: string) => Promise<TaskExecutionResult>,
  ): void {
    this.personaExecutors.set(persona, executor);
  }

  /**
   * Start the scheduler loop
   */
  async start(): Promise<void> {
    this.state.running = true;
    console.log("[Scheduler] Started"); // No secrets in this log

    // Start stuck task detection
    this.startStuckDetection();

    // Main loop
    while (this.state.running) {
      try {
        await this.tick();
      } catch (error) {
        console.error("[Scheduler] Tick error:", redactError(error));
      }

      await this.sleep(this.config.pollIntervalMs);
    }
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    this.state.running = false;
    console.log("[Scheduler] Stopped"); // No secrets in this log
  }

  /**
   * Get scheduler state
   */
  getState(): SchedulerState {
    return { ...this.state };
  }

  /**
   * Trigger a single scheduler tick (useful for integrations/tests).
   */
  async triggerTick(): Promise<void> {
    await this.tick();
  }

  // Private methods

  private async tick(): Promise<void> {
    // Check SMT throttle
    if (!this.smt.canProceed("scheduler.tick")) {
      return;
    }

    // Get next ready task
    let task = await this.taskStore.getNextReady();
    if (!task) {
      await this.promoteHighestPriorityBacklog();
      task = await this.taskStore.getNextReady();
    }
    if (!task) {
      return;
    }

    // Check approval gate
    if (task.requiresApproval && !task.approved) {
      await this.notifyHuman(task);
      return;
    }

    // Get identity context
    const identity = await this.getIdentityContext(task);

    // Execute with persona
    await this.executeTask(task, identity);
  }

  private async executeTask(task: Task, identityContext: string): Promise<void> {
    const executor = this.personaExecutors.get(task.personaOwner);
    if (!executor) {
      console.error(`[Scheduler] No executor for persona: ${redactString(task.personaOwner)}`);
      return;
    }

    try {
      const result = await executor(task, identityContext);

      // Update task
      await this.taskStore.update(task.taskId, {
        status: "DONE",
        outcome: result.outcome as any,
        decisionSummary: result.summary,
        confidence: result.confidence,
      });

      this.state.tasksProcessed++;
      this.state.lastTaskAt = new Date();

      console.log(
        `[Scheduler] Task ${redactString(task.taskId)} completed: ${redactString(result.outcome)}`,
      );
    } catch (error) {
      await this.handleTaskFailure(task, error);
    }
  }

  private async handleTaskFailure(task: Task, error: unknown): Promise<void> {
    const newRetryCount = task.retryCount + 1;

    if (newRetryCount >= task.maxRetries) {
      // Max retries exceeded
      await this.taskStore.update(task.taskId, {
        status: "BLOCKED",
        outcome: "BLOCKED",
        decisionSummary: `Failed after ${task.maxRetries} retries: ${error}`,
      });
      this.state.tasksFailed++;
    } else {
      // Apply backoff
      const backoffMs = this.config.backoffBaseMs * Math.pow(2, task.retryCount);
      await this.taskStore.update(task.taskId, {
        retryCount: newRetryCount,
        lastRetryAt: new Date().toISOString(),
      });

      console.log(
        `[Scheduler] Task ${redactString(task.taskId)} retry ${newRetryCount}/${task.maxRetries} after ${backoffMs}ms`,
      );
    }
  }

  private async getIdentityContext(task: Task): Promise<string> {
    // Get relevant identity fragments for task context
    const results = await this.identityStore.search(task.title + " " + (task.description || ""), {
      limit: 10,
    });

    return results.map((r) => r.fragment.content).join("\n\n");
  }

  private async notifyHuman(task: Task): Promise<void> {
    // Update task status to WAITING_ON_HUMAN
    await this.taskStore.update(task.taskId, {
      status: "WAITING_ON_HUMAN",
      outcome: "REQUIRES_HUMAN",
    });

    // Log notification attempt
    console.log(
      `[Scheduler] Human approval needed for task ${redactString(task.taskId)}: ${redactString(task.title)}`,
    );

    // TODO: Integrate with notification channels:
    // - SMS via Twilio extension
    // - Email via Proton extension
    // - WebChat via gateway
    // For now, we rely on external monitoring/alerting to detect WAITING_ON_HUMAN status
  }

  private async promoteHighestPriorityBacklog(): Promise<Task | null> {
    const backlogTask = await this.taskStore.getHighestPriorityBacklog();
    if (!backlogTask) {
      return null;
    }
    return this.taskStore.update(backlogTask.taskId, { status: TaskStatus.READY });
  }

  private startStuckDetection(): void {
    // Run stuck detection every 5 minutes
    const intervalMs = 5 * 60 * 1000; // 5 minutes

    const checkStuckTasks = async () => {
      try {
        const stuckTasks = await this.taskStore.getStuckTasks(this.config.stuckTaskThresholdMs);

        if (stuckTasks.length > 0) {
          console.warn(`[Scheduler] Found ${stuckTasks.length} stuck task(s)`);

          for (const task of stuckTasks) {
            // Mark as BLOCKED if stuck
            await this.taskStore.update(task.taskId, {
              status: "BLOCKED",
              outcome: "BLOCKED",
              decisionSummary: `Task stuck for ${Math.round((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60))} hours. Auto-blocked by stuck detection.`,
            });

            console.warn(
              `[Scheduler] Auto-blocked stuck task ${redactString(task.taskId)}: ${redactString(task.title)}`,
            );
          }
        }
      } catch (error) {
        console.error("[Scheduler] Stuck task detection error:", redactError(error));
      }
    };

    // Run immediately, then on interval
    checkStuckTasks();
    setInterval(checkStuckTasks, intervalMs);

    console.log("[Scheduler] Stuck task detection started"); // No secrets in this log
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Scheduler Factory
// ============================================================================

export type SchedulerFactory = (
  taskStore: TaskStore,
  identityStore: IdentityStore,
  smt: SMTThrottler,
) => Promise<TaskScheduler>;
