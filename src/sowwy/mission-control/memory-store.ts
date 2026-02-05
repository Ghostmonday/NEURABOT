/**
 * Sowwy In-Memory Task Store - Fallback for Testing
 *
 * ⚠️ USE CASES:
 * - Unit testing without PostgreSQL
 * - Development without Docker
 * - Quick integration tests
 *
 * ⚠️ LIMITATIONS:
 * - Not persistent (data lost on restart)
 * - Not shared across instances
 * - No transaction support
 *
 * ⚠️ PRODUCTION:
 * - Use PostgreSQL store (pg-store.ts) in production
 * - This is ONLY for testing/development
 */

import { Task, TaskCreateInput, TaskFilter, TaskUpdateInput, calculatePriority } from "./schema.js";
import {
  AuditLogEntry,
  AuditStore,
  DecisionLogEntry,
  DecisionStore,
  SowwyStores,
  TaskStore,
} from "./store.js";

// ============================================================================
// In-Memory Task Store
// ============================================================================

export class InMemoryTaskStore implements TaskStore {
  private tasks: Map<string, Task> = new Map();
  private nextReadyCache: Task[] = [];
  private lastUpdate = Date.now();

  async create(input: TaskCreateInput): Promise<Task> {
    const task: Task = {
      taskId: crypto.randomUUID(),
      title: input.title,
      category: input.category,
      personaOwner: input.personaOwner,
      status: "READY",
      outcome: undefined,
      decisionSummary: undefined,
      confidence: undefined,
      urgency: input.urgency ?? 1,
      importance: input.importance ?? 1,
      risk: input.risk ?? 1,
      stressCost: input.stressCost ?? 1,
      slaHours: input.slaHours,
      approved: false,
      approvedBy: undefined,
      createdBy: input.createdBy ?? "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requiresApproval: input.requiresApproval ?? false,
      retryCount: 0,
      maxRetries: input.maxRetries ?? 3,
      dependencies: input.dependencies ?? [],
      contextLinks: input.contextLinks ?? {},
    };

    this.tasks.set(task.taskId, task);
    this.invalidateCache();
    return task;
  }

  async get(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) ?? null;
  }

  async update(taskId: string, input: TaskUpdateInput): Promise<Task | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const updated: Task = {
      ...task,
      ...Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined)),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, updated);
    this.invalidateCache();
    return updated;
  }

  async delete(taskId: string): Promise<boolean> {
    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.invalidateCache();
    }
    return deleted;
  }

  async list(filter?: TaskFilter): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter((t) => t.status === filter.status);
      }
      if (filter.category) {
        tasks = tasks.filter((t) => t.category === filter.category);
      }
      if (filter.personaOwner) {
        tasks = tasks.filter((t) => t.personaOwner === filter.personaOwner);
      }
      const priorityMin = filter.priorityMin;
      if (priorityMin !== undefined) {
        tasks = tasks.filter((t) => t.urgency * t.importance >= priorityMin);
      }
      if (filter.requiresApproval !== undefined) {
        tasks = tasks.filter((t) => t.requiresApproval === filter.requiresApproval);
      }
    }

    return tasks;
  }

  async getNextReady(): Promise<Task | null> {
    this.refreshCacheIfNeeded();
    return this.nextReadyCache[0] ?? null;
  }

  async getByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  async getByCategory(category: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.category === category);
  }

  async getByPersona(persona: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.personaOwner === persona);
  }

  async getHighestPriorityReady(): Promise<Task | null> {
    this.refreshCacheIfNeeded();
    return this.nextReadyCache[0] ?? null;
  }

  async getHighestPriorityBacklog(): Promise<Task | null> {
    const backlog = Array.from(this.tasks.values()).filter((t) => t.status === "BACKLOG");
    if (backlog.length === 0) {
      return null;
    }
    backlog.sort((a, b) => {
      const priorityDelta = calculatePriority(b) - calculatePriority(a);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return backlog[0];
  }

  async getStuckTasks(olderThanMs: number): Promise<Task[]> {
    const cutoff = Date.now() - olderThanMs;
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "READY" && new Date(t.createdAt).getTime() < cutoff,
    );
  }

  async count(filter?: TaskFilter): Promise<number> {
    return (await this.list(filter)).length;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const task of this.tasks.values()) {
      counts[task.status] = (counts[task.status] ?? 0) + 1;
    }
    return counts;
  }

  // Private methods
  private invalidateCache(): void {
    this.lastUpdate = 0;
  }

  private refreshCacheIfNeeded(): void {
    if (Date.now() - this.lastUpdate > 1000) {
      this.refreshCache();
    }
  }

  private refreshCache(): void {
    const ready = Array.from(this.tasks.values())
      .filter((t) => t.status === "READY")
      .toSorted((a, b) => {
        const priorityA = a.urgency * a.importance;
        const priorityB = b.urgency * b.importance;
        return priorityB - priorityA; // Higher priority first
      });

    this.nextReadyCache = ready;
    this.lastUpdate = Date.now();
  }
}

// ============================================================================
// In-Memory Audit Store
// ============================================================================

export class InMemoryAuditStore implements AuditStore {
  private entries: AuditLogEntry[] = [];

  async append(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.entries.push(fullEntry);
    return fullEntry;
  }

  async getByTaskId(taskId: string): Promise<AuditLogEntry[]> {
    return this.entries.filter((e) => e.taskId === taskId);
  }

  async getRecent(limit: number): Promise<AuditLogEntry[]> {
    return this.entries.slice(-limit);
  }
}

// ============================================================================
// In-Memory Decision Store
// ============================================================================

export class InMemoryDecisionStore implements DecisionStore {
  private entries: DecisionLogEntry[] = [];

  async log(entry: Omit<DecisionLogEntry, "id" | "createdAt">): Promise<DecisionLogEntry> {
    const fullEntry: DecisionLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.entries.push(fullEntry);
    return fullEntry;
  }

  async getByTaskId(taskId: string): Promise<DecisionLogEntry[]> {
    return this.entries.filter((e) => e.taskId === taskId);
  }

  async getRecent(limit: number): Promise<DecisionLogEntry[]> {
    return this.entries.slice(-limit);
  }
}

// ============================================================================
// Store Factory
// ============================================================================

export function createInMemoryStores(): SowwyStores {
  const tasks = new InMemoryTaskStore();
  const audit = new InMemoryAuditStore();
  const decisions = new InMemoryDecisionStore();

  return { tasks, audit, decisions };
}
