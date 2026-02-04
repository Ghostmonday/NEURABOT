import type { IdentityCategory, IdentityStore } from "../identity/store.js";
import type { TaskScheduler } from "../mission-control/scheduler.js";
import type { AuditStore, TaskStore } from "../mission-control/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import type { ExtensionFoundation, PersonaExecutor } from "./integration.js";
import { CircuitBreakerRegistry } from "../integrations/circuit-breaker.js";

/**
 * Implementation of ExtensionFoundation
 */
export class ExtensionFoundationImpl implements ExtensionFoundation {
  private circuitBreakers = new CircuitBreakerRegistry();

  constructor(
    private scheduler: TaskScheduler,
    private smt: SMTThrottler,
    private identityStore: IdentityStore,
    private taskStore: TaskStore,
    private auditStore: AuditStore,
  ) {}

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
    this.scheduler.registerPersona(persona as any, async (task, context) => {
      if (!executor.canHandle(task)) {
        throw new Error(`Executor for ${persona} cannot handle task ${task.taskId}`);
      }

      return await executor.execute(task, {
        identityContext: context,
        smt: { recordUsage: (op) => this.recordUsage(op) },
        audit: {
          log: async (entry) => {
            await this.auditStore.append({
              taskId: task.taskId,
              action: entry.action,
              details: { ...entry.details, message: (entry as any).message },
              performedBy: "system",
            });
          },
        },
      });
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
      create: (input: any) => this.taskStore.create(input),
      update: (taskId: string, input: any) => this.taskStore.update(taskId, input),
      get: (taskId: string) => this.taskStore.get(taskId),
    };
  }

  async logAudit(entry: any): Promise<void> {
    await this.auditStore.append({ ...entry, performedBy: "system" });
  }

  triggerSchedulerTick(): void {
    this.scheduler.triggerTick();
  }

  pauseScheduler(reason: string): void {
    this.smt.pause(); // Or scheduler-specific pause if exists
  }

  resumeScheduler(): void {
    this.smt.resume();
  }
}
