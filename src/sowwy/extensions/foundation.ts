import type { Logger as TsLogger } from "tslog";
import type { IdentityCategory, IdentityStore } from "../identity/store.js";
import type { TaskScheduler } from "../mission-control/scheduler.js";
import type {
  PersonaOwner,
  TaskCreateInput,
  TaskFilter,
  TaskUpdateInput,
} from "../mission-control/schema.js";
import type { AuditLogEntry, AuditStore, TaskStore } from "../mission-control/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import type { ExtensionFoundation, PersonaExecutor } from "./integration.js";
import { getChildLogger } from "../../logging/logger.js";
import { CircuitBreakerRegistry } from "../integrations/circuit-breaker.js";
import { recordPattern } from "./overseer/index.js";

/**
 * @fileoverview ExtensionFoundation Implementation
 *
 * Provides extension registration, circuit breaker management, and Foundry
 * observation layer support for autonomous agent behavior crystallization.
 *
 * This module implements the ExtensionFoundation interface, providing core
 * services to extensions including:
 * - Circuit breaker management for external dependencies
 * - SMT (Self-Modification Throttler) integration for rate limiting
 * - Persona executor registration for task handling
 * - Identity and task store access
 * - Audit logging capabilities
 *
 * TODO: Add Foundry observation layer. Track tool sequence patterns, success rates, and
 * outcomes. Identify crystallization candidates (5+ runs, 70%+ success). Generate
 * TypeScript tool code from successful patterns. Register new tools via extension loader.
 * Trigger gateway reload after tool registration.
 */
export class ExtensionFoundationImpl implements ExtensionFoundation {
  private circuitBreakers = new CircuitBreakerRegistry();
  private identityStoreWithWrite: IdentityStore | null = null;

  constructor(
    private scheduler: TaskScheduler,
    private smt: SMTThrottler,
    private identityStore: IdentityStore,
    private taskStore: TaskStore,
    private auditStore: AuditStore,
    identityStoreWithWrite?: IdentityStore,
  ) {
    this.identityStoreWithWrite = identityStoreWithWrite || null;
  }

  /**
   * Get identity store with write access (for extraction pipeline only).
   * Returns null if write access not available.
   */
  getIdentityStoreWithWrite(): IdentityStore | null {
    return this.identityStoreWithWrite;
  }

  /**
   * Registers or retrieves a circuit breaker for the given operation.
   * @param name - The unique identifier for the circuit breaker
   * @returns The circuit breaker instance for the named operation
   */
  registerCircuitBreaker(name: string) {
    return this.circuitBreakers.getOrCreate(name);
  }

  canProceed(operation: string, category?: string): boolean {
    return this.smt.canProceed(operation, category);
  }

  recordUsage(operation: string): void {
    this.smt.recordUsage(operation);
  }

  registerPersonaExecutor(persona: string, executor: PersonaExecutor): void {
    // Wrap PersonaExecutor into the scheduler's expected format
    this.scheduler.registerPersona(persona as PersonaOwner, async (task, context) => {
      if (!executor.canHandle(task)) {
        throw new Error(`Executor for ${persona} cannot handle task ${task.taskId}`);
      }

      // Create task-specific logger with metadata
      const taskLogger = getChildLogger({
        subsystem: "sowwy-executor",
        taskId: task.taskId,
        persona,
      });

      const startTime = Date.now();

      // Track tool sequence pattern for Foundry observation layer
      // In a full implementation, this would track actual tool calls made during execution
      // For now, we track the task category and persona as a pattern identifier
      const patternId = `${persona}:${task.category}`;
      const toolSequence: string[] = []; // Would be populated with actual tool calls in full implementation

      try {
        const result = await executor.execute(task, {
          identityContext: context,
          smt: { recordUsage: (op) => this.recordUsage(op) },
          audit: {
            log: async (entry) => {
              await this.auditStore.append({
                taskId: task.taskId,
                action: entry.action,
                details: {
                  ...entry.details,
                  message: (entry as { message?: string }).message,
                },
                performedBy: "system",
              });
            },
          },
          logger: taskLogger as TsLogger<Record<string, unknown>>,
        });

        // Record pattern success for Foundry observation layer
        const durationMs = Date.now() - startTime;
        recordPattern(patternId, toolSequence, result.success, durationMs);

        return result;
      } catch (error) {
        // Record pattern failure
        const durationMs = Date.now() - startTime;
        recordPattern(patternId, toolSequence, false, durationMs);
        throw error;
      }
    });
  }

  getIdentityStore() {
    return {
      search: (query: string, options?: { limit?: number }) =>
        this.identityStore.search(query, options),
      getByCategory: (category: string) =>
        this.identityStore.getByCategory(category as IdentityCategory),
    };
  }

  getTaskStore() {
    return {
      create: (input: TaskCreateInput) => this.taskStore.create(input),
      update: (taskId: string, input: TaskUpdateInput) => this.taskStore.update(taskId, input),
      get: (taskId: string) => this.taskStore.get(taskId),
      count: (filter?: TaskFilter) => this.taskStore.count(filter),
    };
  }

  async logAudit(entry: Omit<AuditLogEntry, "id" | "createdAt" | "performedBy">): Promise<void> {
    await this.auditStore.append({ ...entry, performedBy: "system" });
  }

  triggerSchedulerTick(): void {
    void this.scheduler.triggerTick();
  }

  pauseScheduler(_reason: string): void {
    this.smt.pause(); // Or scheduler-specific pause if exists
  }

  resumeScheduler(): void {
    this.smt.resume();
  }
}
