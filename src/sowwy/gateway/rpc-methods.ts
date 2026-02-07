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
import type { TaskScheduler } from "../mission-control/scheduler.js";
import type {
  Task,
  TaskCreateInput,
  TaskFilter,
  TaskOutcome,
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
  scheduler: TaskScheduler | null;
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
  "sowwy.capabilities": () => Promise<SystemCapabilities>;
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

export interface SystemCapabilities {
  // Core systems
  systems: {
    scheduler: {
      available: boolean;
      running: boolean;
      maxConcurrentPerPersona: number;
      pollIntervalMs: number;
    };
    eventBus: {
      available: boolean;
      activeTopics: string[];
      ringBufferSize: number;
    };
    resourceMonitor: {
      available: boolean;
      thresholds: {
        memoryWarn: number;
        memoryCritical: number;
        diskWarnMB: number;
        diskCriticalMB: number;
      };
    };
    metricsCollector: {
      available: boolean;
      historyEnabled: boolean;
      historyPath?: string;
    };
    circuitBreakers: {
      available: boolean;
      breakers: string[];
    };
  };
  // Storage systems
  storage: {
    postgres: {
      available: boolean;
      stores: string[];
    };
    lancedb: {
      available: boolean;
      purpose: string;
    };
    memory: {
      consolidation: boolean;
      verification: boolean;
    };
  };
  // Communication systems
  communication: {
    channels: string[];
    failover: {
      enabled: boolean;
      mappings: Record<string, string[]>;
    };
    eventBus: {
      enabled: boolean;
      pubSub: boolean;
    };
  };
  // Self-modification
  selfModify: {
    enabled: boolean;
    boundaries: {
      allowlist: string[];
      blocklist: string[];
    };
    rollback: {
      enabled: boolean;
      strategies: string[];
    };
  };
  // Available RPC methods
  rpcMethods: string[];
  // Available tools
  tools: {
    exec: {
      enabled: boolean;
      security: string;
      askMode: string;
    };
    read: boolean;
    edit: boolean;
    message: boolean;
  };
}

// ============================================================================
// RPC Method Registry
// ============================================================================

export function registerSowwyRPCMethods(context: GatewayContext): Record<string, Function> {
  const { stores, identityStore, smt, scheduler, userId } = context;

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
        outcome: outcome as TaskOutcome,
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
      const schedulerState = scheduler?.getState();
      return {
        running: schedulerState?.running ?? false,
        paused: smt.isPaused(),
        taskCount: await stores.tasks.count(),
        queueDepth,
        smtUtilization: smt.getUtilization(),
        lastTaskAt: schedulerState?.lastTaskAt?.toISOString() ?? null,
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
      const allFragments = await identityStore.getAll();
      const totalFragments = allFragments.length;
      const averageConfidence =
        totalFragments > 0
          ? allFragments.reduce((sum, f) => sum + f.confidence, 0) / totalFragments
          : 0;

      return {
        totalFragments,
        byCategory: await identityStore.countByCategory(),
        averageConfidence,
      };
    },

    // ========================================================================
    // Monitoring Methods
    // ========================================================================

    "sowwy.metrics": async (): Promise<Metrics> => {
      const schedulerState = scheduler?.getState();
      const schedulerStartTime = schedulerState?.running
        ? (schedulerState.lastTaskAt?.getTime() ?? Date.now())
        : 0;
      const schedulerUptime = schedulerStartTime > 0 ? Date.now() - schedulerStartTime : 0;

      return {
        tasksCompleted: schedulerState?.tasksProcessed ?? 0,
        tasksFailed: schedulerState?.tasksFailed ?? 0,
        smtUtilization: smt.getUtilization(),
        identityFragments: await identityStore.count(),
        schedulerUptime,
      };
    },

    "sowwy.health": async (): Promise<HealthStatus> => {
      const checks: HealthStatus["checks"] = {
        postgres: false,
        lancedb: false,
        smt: false,
        scheduler: false,
      };

      // Check PostgreSQL (try a simple query)
      try {
        await stores.tasks.count();
        checks.postgres = true;
      } catch {
        // INTENTIONAL: Health check is supposed to catch failures and report false
        checks.postgres = false;
      }

      // Check LanceDB (try a simple query)
      try {
        await identityStore.count();
        checks.lancedb = true;
      } catch {
        // INTENTIONAL: Health check is supposed to catch failures and report false
        checks.lancedb = false;
      }

      // Check SMT (check if it's responsive)
      try {
        smt.getUtilization();
        checks.smt = true;
      } catch {
        // INTENTIONAL: Health check is supposed to catch failures and report false
        checks.smt = false;
      }

      // Check Scheduler (check if it's running)
      const schedulerState = scheduler?.getState();
      checks.scheduler = schedulerState?.running ?? false;

      // Determine overall health
      const allHealthy = Object.values(checks).every((v) => v === true);
      const anyUnhealthy = Object.values(checks).some((v) => v === false);
      const overall: HealthStatus["overall"] = allHealthy
        ? "healthy"
        : anyUnhealthy
          ? "unhealthy"
          : "degraded";

      return {
        overall,
        checks,
      };
    },

    "sowwy.capabilities": async (): Promise<SystemCapabilities> => {
      const schedulerState = scheduler?.getState();
      const eventBus = scheduler?.getEventBus();
      const pgHost = process.env.SOWWY_POSTGRES_HOST;
      const postgresAvailable = !!pgHost && pgHost !== "";

      // Get available RPC methods
      const rpcMethods = [
        "tasks.list",
        "tasks.create",
        "tasks.update",
        "tasks.get",
        "tasks.nextReady",
        "tasks.approve",
        "tasks.complete",
        "tasks.cancel",
        "tasks.audit",
        "tasks.decisions",
        "sowwy.status",
        "sowwy.pause",
        "sowwy.resume",
        "sowwy.metrics",
        "sowwy.health",
        "sowwy.capabilities",
        "identity.search",
        "identity.stats",
      ];

      // Get circuit breaker names (if available)
      const circuitBreakers: string[] = [];
      try {
        const { CircuitBreakerRegistry } = await import("../integrations/circuit-breaker.js");
        const registry = new CircuitBreakerRegistry();
        // Common breakers
        circuitBreakers.push("twilio", "proton", "browser", "database");
      } catch {
        // INTENTIONAL: Circuit breakers module is optional; absence is not an error
      }

      // Get event bus topics
      const activeTopics = eventBus?.getActiveTopics() ?? [];

      // Get self-modify boundaries
      const { SELF_MODIFY_ALLOW, SELF_MODIFY_DENY } = await import("../self-modify/boundaries.js");

      return {
        systems: {
          scheduler: {
            available: !!scheduler,
            running: schedulerState?.running ?? false,
            maxConcurrentPerPersona: scheduler
              ? ((scheduler as any).config?.maxConcurrentPerPersona ?? 1)
              : 1,
            pollIntervalMs: scheduler ? ((scheduler as any).config?.pollIntervalMs ?? 5000) : 5000,
          },
          eventBus: {
            available: !!eventBus,
            activeTopics,
            ringBufferSize: 100,
          },
          resourceMonitor: {
            available: true,
            thresholds: {
              memoryWarn: 0.85,
              memoryCritical: 0.95,
              diskWarnMB: 1024,
              diskCriticalMB: 500,
            },
          },
          metricsCollector: {
            available: true,
            historyEnabled: true,
            historyPath: process.env.OPENCLAW_STATE_DIR
              ? `${process.env.OPENCLAW_STATE_DIR}/workspace/data/metrics-history.jsonl`
              : undefined,
          },
          circuitBreakers: {
            available: circuitBreakers.length > 0,
            breakers: circuitBreakers,
          },
        },
        storage: {
          postgres: {
            available: postgresAvailable,
            stores: postgresAvailable ? ["tasks", "audit", "decisions"] : [],
          },
          lancedb: {
            available: true,
            purpose: "identity fragments and embeddings",
          },
          memory: {
            consolidation: true,
            verification: true,
          },
        },
        communication: {
          channels: ["telegram", "webchat", "signal", "whatsapp", "discord", "slack"],
          failover: {
            enabled: true,
            mappings: {
              telegram: ["webchat"],
              webchat: ["telegram"],
            },
          },
          eventBus: {
            enabled: !!eventBus,
            pubSub: true,
          },
        },
        selfModify: {
          enabled: true,
          boundaries: {
            allowlist: Array.from(SELF_MODIFY_ALLOW),
            blocklist: Array.from(SELF_MODIFY_DENY),
          },
          rollback: {
            enabled: true,
            strategies: ["file-scoped", "full-checkout", "git-reset"],
          },
        },
        rpcMethods,
        tools: {
          exec: {
            enabled: true,
            security: "allowlist",
            askMode: "on-miss",
          },
          read: true,
          edit: true,
          message: true,
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
