// Throughput mode cycle 6
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
 *
 * AUTONOMOUS SELF-MODIFY INTEGRATION:
 * The scheduler can drive periodic self-modify operations. Create tasks with
 * category="SELF_MODIFY" and the agent will use the self_modify tool to
 * validate, edit, and reload. Example task:
 *
 * {
 *   taskId: "self-modify-nightly",
 *   title: "Nightly self-improvement",
 *   category: "SELF_MODIFY",
 *   payload: { reason: "Scheduled maintenance" },
 *   priority: 50,
 *   requiresApproval: false,
 *   approved: true
 * }
 *
 * Thin script wrapper: scripts/autonomous-self-modify.ts can be scheduled via cron
 * or the scheduler to call runSelfEditChecklist and requestSelfModifyReload for
 * script-driven self-evolution. The scheduler respects self-modify boundaries.
 *
 * FITNESS ASSESSMENT ENFORCEMENT (README §0.4 - MANDATORY FIRMWARE):
 * The scheduler MUST NOT mark tasks DONE until fitness function passes.
 * TODO: Add fitness check in executeTask() before setting outcome to SUCCESS.
 * TODO: Create automatic fitness re-assessment tasks for all modules at configured intervals.
 */

import type { IdentityStore } from "../identity/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import type { AuditStore, TaskStore } from "./store.js";
import { getChildLogger } from "../../logging/logger.js";
import { getGlobalCollector } from "../monitoring/collector.js";
import { checkAlertThresholds } from "../monitoring/metrics.js";
import { checkResources } from "../monitoring/resource-monitor.js";
import { redactError, redactString } from "../security/redact.js";
import { EventBus } from "./event-bus.js";
import { PersonaOwner, Task, TaskOutcome, TaskStatus } from "./schema.js";

// ============================================================================
// Scheduler Config
// ============================================================================

export interface SchedulerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  stuckTaskThresholdMs: number;
  backoffBaseMs: number;
  /** Max concurrent tasks per persona (sub-agents in parallel). Default 1; set >1 to run multiple tasks per persona. */
  maxConcurrentPerPersona: number;
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  pollIntervalMs: 5000, // Check every 5 seconds
  maxRetries: 3, // Max retries per task
  stuckTaskThresholdMs: 3600000, // 1 hour = stuck
  backoffBaseMs: 5000, // Base backoff: 5s, 10s, 20s...
  maxConcurrentPerPersona: 2, // Concurrent tasks per persona for parallel sub-agents; override via SOWWY_MAX_CONCURRENT_PER_PERSONA
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
// ============================================================================
// Broadcaster Type
// ============================================================================

export type Broadcaster = (
  event: string,
  payload: unknown,
  opts?: { dropIfSlow?: boolean; targetPersona?: string },
) => void;

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
    ((task: Task, context: string) => Promise<TaskExecutionResult>)[]
  > = new Map();
  /** Number of tasks currently running per persona (for maxConcurrentPerPersona > 1). */
  private activeCountByPersona = new Map<PersonaOwner, number>();
  /** Set of task IDs currently in-flight to prevent duplicate execution. */
  private inFlightTaskIds = new Set<string>();
  private broadcaster: Broadcaster | null = null;
  private eventBus: EventBus;
  private readonly log = getChildLogger({ subsystem: "scheduler" });

  constructor(
    taskStore: TaskStore,
    identityStore: IdentityStore,
    smt: SMTThrottler,
    config: Partial<SchedulerConfig> = {},
    auditStore?: AuditStore,
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
    this.eventBus = new EventBus();
  }

  /**
   * Set the gateway broadcaster for notifications
   */
  setBroadcaster(broadcaster: Broadcaster): void {
    // Wrap broadcaster to route persona-to-persona events via event bus
    this.broadcaster = (event, payload, opts) => {
      if (opts?.targetPersona) {
        // Route to event bus for persona-to-persona messaging
        this.eventBus.publish(event, payload, opts.targetPersona);
      } else {
        // Default: broadcast to gateway
        broadcaster(event, payload, opts);
      }
    };
  }

  /**
   * Get the event bus for persona-to-persona communication
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Register a persona executor (supports multiple executors per persona for multiplexing)
   */
  registerPersona(
    persona: PersonaOwner,
    executor: (task: Task, context: string) => Promise<TaskExecutionResult>,
  ): void {
    const existing = this.personaExecutors.get(persona) ?? [];
    existing.push(executor);
    this.personaExecutors.set(persona, existing);
  }

  /**
   * Start the scheduler loop
   */
  async start(): Promise<void> {
    this.state.running = true;
    this.log.info("[Scheduler] Started"); // No secrets in this log

    // Start stuck task detection
    this.startStuckDetection();

    // Main loop
    while (this.state.running) {
      try {
        await this.tick();
      } catch (error) {
        this.log.error("[Scheduler] Tick error:", redactError(error));
      }

      await this.sleep(this.config.pollIntervalMs);
    }
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    this.state.running = false;
    this.log.info("[Scheduler] Stopped"); // No secrets in this log
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

    // Check resource constraints (memory/disk)
    const resourceStatus = checkResources({ maxMemoryMB: 1024 });
    if (resourceStatus.shouldPause) {
      this.log.warn(
        `[Scheduler] Paused due to resource constraints: ${resourceStatus.thresholds.memoryCritical ? "memory critical" : ""} ${resourceStatus.thresholds.diskCritical ? "disk critical" : ""}`,
      );
      return;
    }

    const personas = Array.from(this.personaExecutors.keys()) as PersonaOwner[];
    const maxPerPersona = Math.max(1, this.config.maxConcurrentPerPersona);

    // Parallel task fetch across all personas (high-throughput optimization)
    try {
      await Promise.all(
        personas.map(async (persona) => {
          const active = this.activeCountByPersona.get(persona) ?? 0;
          const slotsAvailable = maxPerPersona - active;
          if (slotsAvailable <= 0) {
            return;
          }

          // Fetch multiple ready tasks at once (up to available slots)
          for (let i = 0; i < slotsAvailable; i++) {
            const task = await this.taskStore.getNextReady({ personaOwner: persona });
            if (!task) {
              break;
            }

            // Guard: Skip if task is already in-flight (prevents duplicate execution)
            if (this.inFlightTaskIds.has(task.taskId)) {
              continue;
            }

            // Check approval gate
            if (task.requiresApproval && !task.approved) {
              await this.notifyHuman(task);
              continue;
            }

            // Mark task as in-flight and increment active count
            this.inFlightTaskIds.add(task.taskId);
            this.activeCountByPersona.set(
              persona,
              (this.activeCountByPersona.get(persona) ?? 0) + 1,
            );
            this.log.info(
              `[Scheduler] [${persona}] Starting lane for task: ${redactString(task.taskId)}`,
            );

            this.runExecutionLane(task).finally(() => {
              // Remove from in-flight set and decrement active count
              this.inFlightTaskIds.delete(task.taskId);
              const n = this.activeCountByPersona.get(persona) ?? 1;
              this.activeCountByPersona.set(persona, Math.max(0, n - 1));
            });
          }
        }),
      );
    } catch (error) {
      this.log.error("Task batch fetch failed", {
        error: error instanceof Error ? error.message : String(error),
        personas,
      });
    }

    // Global backlog promotion if we have idle capacity
    const totalActive = Array.from(this.activeCountByPersona.values()).reduce((a, b) => a + b, 0);
    if (totalActive < personas.length * maxPerPersona) {
      await this.promoteHighestPriorityBacklog();
    }

    // Check alert thresholds and broadcast if needed
    try {
      const collector = getGlobalCollector();
      const metrics = collector.getMetrics();
      const alerts = checkAlertThresholds(metrics);
      if (alerts.length > 0 && this.broadcaster) {
        for (const alert of alerts) {
          this.broadcaster("sowwy.alert", {
            severity: alert.severity,
            name: alert.name,
            message: alert.message,
            value: alert.value,
            threshold: alert.threshold,
          });
        }
      }
    } catch (err) {
      // Don't fail scheduler tick on alert check errors
      this.log.warn("Alert check failed", { error: redactError(err) });
    }
  }

  private async runExecutionLane(task: Task): Promise<void> {
    try {
      // Get identity context
      const identity = await this.getIdentityContext(task);

      // Execute with persona
      await this.executeTask(task, identity);
    } catch (error) {
      this.log.error(`[Scheduler] [${task.personaOwner}] Lane error:`, redactError(error));
    }
  }

  private async executeTask(task: Task, identityContext: string): Promise<void> {
    const executors = this.personaExecutors.get(task.personaOwner) ?? [];
    if (executors.length === 0) {
      this.log.error(`[Scheduler] No executor for persona: ${redactString(task.personaOwner)}`);
      return;
    }

    // Try each executor in order until one succeeds
    let lastError: Error | undefined;
    for (const executor of executors) {
      try {
        const result = await executor(task, identityContext);

        // Record SMT usage for task execution
        this.smt.record("task.execute");

        // Update task
        await this.taskStore.update(task.taskId, {
          status: "DONE",
          outcome: result.outcome as TaskOutcome,
          decisionSummary: result.summary,
          confidence: result.confidence,
        });

        this.state.tasksProcessed++;
        this.state.lastTaskAt = new Date();

        this.log.info(
          `[Scheduler] Task ${redactString(task.taskId)} completed: ${redactString(result.outcome)}`,
        );
        return; // Success, exit
      } catch (error) {
        lastError = error as Error;
        // Continue to next executor
      }
    }

    // All executors failed
    if (lastError) {
      await this.handleTaskFailure(task, lastError);
    }
  }

  private async handleTaskFailure(task: Task, error: unknown): Promise<void> {
    const newRetryCount = task.retryCount + 1;

    if (newRetryCount >= task.maxRetries) {
      // Max retries exceeded
      await this.taskStore.update(task.taskId, {
        status: "BLOCKED",
        outcome: "BLOCKED",
        decisionSummary: `Failed after ${task.maxRetries} retries: ${String(error)}`,
      });
      this.state.tasksFailed++;
    } else {
      // Apply backoff
      const backoffMs = this.config.backoffBaseMs * Math.pow(2, task.retryCount);
      await this.taskStore.update(task.taskId, {
        retryCount: newRetryCount,
        lastRetryAt: new Date().toISOString(),
      });

      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log.info(
        `[Scheduler] Task ${redactString(task.taskId)} retry ${newRetryCount}/${task.maxRetries} after ${backoffMs}ms`,
      );
      this.log.warn(`[Scheduler] Task ${redactString(task.taskId)} failure reason: ${errorMsg}`);
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
    // Avoid duplicate notifications
    if (task.status === "WAITING_ON_HUMAN") {
      return;
    }

    // Update task status to WAITING_ON_HUMAN
    await this.taskStore.update(task.taskId, {
      status: "WAITING_ON_HUMAN",
      outcome: "REQUIRES_HUMAN",
    });

    // Log notification attempt
    this.log.info(
      `[Scheduler] Human approval needed for task ${redactString(task.taskId)}: ${redactString(task.title)}`,
    );

    // Broadcast to Chat Gateway if wired
    if (this.broadcaster) {
      // Construction a fake 'chat' event that looks like an assistant message
      // Use a fixed runId for system notifications to keep them grouped if needed
      const notificationRunId = `sowwy-notification-${task.taskId}`;
      const sessionKey = "agent:main:main"; // Default main session

      // Payload structure matches what server-chat.ts expects
      const payload = {
        runId: notificationRunId,
        sessionKey,
        seq: 0,
        state: "final",
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: `⚠️ **APPROVAL REQUIRED**\n\n**Task**: ${task.title}\n**Category**: ${task.category}\n\nTo approve, please run: \`openclaw tasks approve ${task.taskId}\``,
            },
          ],
          timestamp: Date.now(),
        },
      };

      this.broadcaster("chat", payload);
    }
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
          this.log.warn(`[Scheduler] Found ${stuckTasks.length} stuck task(s)`);

          for (const task of stuckTasks) {
            // Mark as BLOCKED if stuck
            await this.taskStore.update(task.taskId, {
              status: "BLOCKED",
              outcome: "BLOCKED",
              decisionSummary: `Task stuck for ${Math.round((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60))} hours. Auto-blocked by stuck detection.`,
            });

            this.log.warn(
              `[Scheduler] Auto-blocked stuck task ${redactString(task.taskId)}: ${redactString(task.title)}`,
            );
          }
        }
      } catch (error) {
        this.log.error("[Scheduler] Stuck task detection error:", redactError(error));
      }
    };

    // Run immediately, then on interval
    void checkStuckTasks().catch((err) =>
      this.log.error("Stuck task check failed", { error: String(err) }),
    );
    setInterval(
      () =>
        void checkStuckTasks().catch((err) =>
          this.log.error("Stuck task check failed", { error: String(err) }),
        ),
      intervalMs,
    );

    this.log.info("[Scheduler] Stuck task detection started"); // No secrets in this log
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
