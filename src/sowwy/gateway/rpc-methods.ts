/**
 * Sowwy Gateway RPC Methods
 *
 * Registers tasks.* methods with the OpenClaw Gateway:
 * - tasks.list - List tasks with filters
 * - tasks.create - Create a new task
 * - tasks.update - Update an existing task
 * - tasks.get - Get a single task
 * - tasks.nextReady - Get highest priority READY task
 *
 * Also registers:
 * - sowwy.status - System status
 * - sowwy.pause - Global pause (kill switch)
 * - sowwy.resume - Resume from pause
 * - identity.search - Search identity context
 */

// ============================================================================
// RPC Method Types
// ============================================================================

import type { SearchResult } from "../identity/fragments.js";
import type { IdentityStore } from "../identity/store.js";
import type {
  Task,
  TaskCreateInput,
  TaskFilter,
  TaskUpdateInput,
} from "../mission-control/schema.js";
import type { AuditLogEntry, DecisionLogEntry, SowwyStores } from "../mission-control/store.js";
import type { SMTThrottler } from "../smt/throttler.js";

// ============================================================================
// Gateway Context
// ============================================================================

export interface GatewayContext {
  stores: SowwyStores;
  identityStore: IdentityStore;
  smt: SMTThrottler;
  userId: string;
}

// ============================================================================
// RPC Method Signatures
// ============================================================================

export interface TaskRPCMethods {
  // Task CRUD
  "tasks.list": (filter?: TaskFilter) => Promise<Task[]>;
  "tasks.create": (input: TaskCreateInput) => Promise<Task>;
  "tasks.update": (taskId: string, input: TaskUpdateInput) => Promise<Task | null>;
  "tasks.get": (taskId: string) => Promise<Task | null>;
  "tasks.nextReady": () => Promise<Task | null>;

  // Task lifecycle
  "tasks.approve": (taskId: string) => Promise<Task | null>;
  "tasks.complete": (
    taskId: string,
    outcome: string,
    summary: string,
    confidence: number,
  ) => Promise<Task | null>;
  "tasks.cancel": (taskId: string, reason: string) => Promise<Task | null>;

  // Audit & decisions
  "tasks.audit": (taskId: string) => Promise<AuditLogEntry[]>;
  "tasks.decisions": (taskId: string) => Promise<DecisionLogEntry[]>;
}

export interface SowwyRPCMethods extends TaskRPCMethods {
  // System control
  "sowwy.status": () => Promise<SowwyStatus>;
  "sowwy.pause": (reason: string) => Promise<{ success: boolean }>;
  "sowwy.resume": () => Promise<{ success: boolean }>;

  // Identity
  "identity.search": (query: string, options?: { limit?: number }) => Promise<SearchResult[]>;
  "identity.stats": () => Promise<IdentityStats>;

  // Monitoring
  "sowwy.metrics": () => Promise<Metrics>;
  "sowwy.health": () => Promise<HealthStatus>;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SowwyStatus {
  running: boolean;
  paused: boolean;
  taskCount: number;
  queueDepth: number;
  smtUtilization: number;
  lastTaskAt: string | null;
}

export interface IdentityStats {
  totalFragments: number;
  byCategory: Record<string, number>;
  averageConfidence: number;
}

export interface Metrics {
  tasksCompleted: number;
  tasksFailed: number;
  smtUtilization: number;
  identityFragments: number;
  schedulerUptime: number;
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  checks: {
    postgres: boolean;
    lancedb: boolean;
    smt: boolean;
    scheduler: boolean;
  };
}

// ============================================================================
// RPC Method Registry
// ============================================================================

export function registerSowwyRPCMethods(context: GatewayContext): Record<string, Function> {
  const { stores, identityStore, smt, userId } = context;

  return {
    // ========================================================================
    // Task CRUD Methods
    // ========================================================================

    "tasks.list": async (filter?: TaskFilter): Promise<Task[]> => {
      return stores.tasks.list(filter);
    },

    "tasks.create": async (input: TaskCreateInput): Promise<Task> => {
      // Validate input
      if (!input.title || !input.category || !input.personaOwner) {
        throw new Error("Missing required fields: title, category, personaOwner");
      }

      const task = await stores.tasks.create({
        ...input,
        createdBy: userId,
      });

      // Audit log
      await stores.audit.append({
        taskId: task.taskId,
        action: "created",
        details: { title: task.title, category: task.category },
        performedBy: userId,
      });

      return task;
    },

    "tasks.update": async (taskId: string, input: TaskUpdateInput): Promise<Task | null> => {
      const existing = await stores.tasks.get(taskId);
      if (!existing) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task = await stores.tasks.update(taskId, input);
      if (task) {
        await stores.audit.append({
          taskId,
          action: "updated",
          details: { changes: input },
          performedBy: userId,
        });
      }

      return task;
    },

    "tasks.get": async (taskId: string): Promise<Task | null> => {
      return stores.tasks.get(taskId);
    },

    "tasks.nextReady": async (): Promise<Task | null> => {
      return stores.tasks.getNextReady();
    },

    // ========================================================================
    // Task Lifecycle Methods
    // ========================================================================

    "tasks.approve": async (taskId: string): Promise<Task | null> => {
      const task = await stores.tasks.update(taskId, {
        approved: true,
        approvedBy: userId,
      });

      if (task) {
        await stores.audit.append({
          taskId,
          action: "approved",
          details: { approvedBy: userId },
          performedBy: userId,
        });
      }

      return task;
    },

    "tasks.complete": async (
      taskId: string,
      outcome: string,
      summary: string,
      confidence: number,
    ): Promise<Task | null> => {
      const task = await stores.tasks.update(taskId, {
        status: "DONE",
        outcome: outcome as any,
        decisionSummary: summary,
        confidence,
      });

      if (task) {
        await stores.audit.append({
          taskId,
          action: "completed",
          details: { outcome, summary, confidence },
          performedBy: userId,
        });

        await stores.decisions.log({
          taskId,
          decision: outcome,
          reasoning: summary,
          confidence,
          personaUsed: task.personaOwner,
          outcome,
        });
      }

      return task;
    },

    "tasks.cancel": async (taskId: string, reason: string): Promise<Task | null> => {
      const task = await stores.tasks.update(taskId, {
        status: "DONE",
        outcome: "ABORTED",
        decisionSummary: reason,
      });

      if (task) {
        await stores.audit.append({
          taskId,
          action: "cancelled",
          details: { reason },
          performedBy: userId,
        });
      }

      return task;
    },

    // ========================================================================
    // Audit & Decision Methods
    // ========================================================================

    "tasks.audit": async (taskId: string): Promise<AuditLogEntry[]> => {
      return stores.audit.getByTaskId(taskId);
    },

    "tasks.decisions": async (taskId: string): Promise<DecisionLogEntry[]> => {
      return stores.decisions.getByTaskId(taskId);
    },

    // ========================================================================
    // System Control Methods
    // ========================================================================

    "sowwy.status": async (): Promise<SowwyStatus> => {
      const queueDepth = await stores.tasks.count({ status: "READY", requiresApproval: undefined });
      return {
        running: true,
        paused: smt.isPaused(),
        taskCount: await stores.tasks.count(),
        queueDepth,
        smtUtilization: smt.getUtilization(),
        lastTaskAt: null, // TODO: Track this
      };
    },

    "sowwy.pause": async (reason: string): Promise<{ success: boolean }> => {
      smt.pause();
      await stores.audit.append({
        taskId: "system",
        action: "pause",
        details: { reason, pausedBy: userId },
        performedBy: userId,
      });
      return { success: true };
    },

    "sowwy.resume": async (): Promise<{ success: boolean }> => {
      smt.resume();
      await stores.audit.append({
        taskId: "system",
        action: "resume",
        details: { resumedBy: userId },
        performedBy: userId,
      });
      return { success: true };
    },

    // ========================================================================
    // Identity Methods
    // ========================================================================

    "identity.search": async (
      query: string,
      options?: { limit?: number },
    ): Promise<SearchResult[]> => {
      return identityStore.search(query, options);
    },

    "identity.stats": async (): Promise<IdentityStats> => {
      return {
        totalFragments: await identityStore.count(),
        byCategory: await identityStore.countByCategory(),
        averageConfidence: 0, // TODO: Calculate
      };
    },

    // ========================================================================
    // Monitoring Methods
    // ========================================================================

    "sowwy.metrics": async (): Promise<Metrics> => {
      return {
        tasksCompleted: 0, // TODO: Track
        tasksFailed: 0,
        smtUtilization: smt.getUtilization(),
        identityFragments: await identityStore.count(),
        schedulerUptime: 0,
      };
    },

    "sowwy.health": async (): Promise<HealthStatus> => {
      // TODO: Implement actual health checks
      return {
        overall: "healthy",
        checks: {
          postgres: true,
          lancedb: true,
          smt: true,
          scheduler: true,
        },
      };
    },
  };
}

// ============================================================================
// Re-export types
// ============================================================================

export type { SearchResult } from "../identity/fragments.js";
export type {
  Task,
  TaskCreateInput,
  TaskFilter,
  TaskUpdateInput,
} from "../mission-control/schema.js";
export type { AuditLogEntry, DecisionLogEntry } from "../mission-control/store.js";

// Export HealthStatus as GatewayHealthStatus to avoid conflict with monitoring/metrics
export type GatewayHealthStatus = HealthStatus;
