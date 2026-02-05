/**
 * Sowwy Extension Integration Guide
 *
 * How extensions integrate with the Sowwy foundation:
 * - Scheduler integration
 * - Circuit breaker registration
 * - SMT throttling
 * - Identity access
 * - Task store access
 */

import type { IdentityFragment, SearchResult } from "../identity/fragments.js";
// Import types from foundation modules
import type { Task, TaskCreateInput, TaskUpdateInput } from "../mission-control/schema.js";
import type { AuditLogEntry } from "../mission-control/store.js";
export type ExtensionAuditLogEntry = Omit<
  AuditLogEntry,
  "id" | "createdAt" | "taskId" | "performedBy"
>;

// ============================================================================
// Extension Foundation Interface
// ============================================================================

/**
 * ExtensionFoundation provides the bridge between extensions and the Sowwy core.
 * Extensions receive this interface when they are initialized.
 */
export interface ExtensionFoundation {
  // ========================================================================
  // Circuit Breaker Registry
  // ========================================================================
  // Extensions register circuit breakers for their external dependencies.
  // The registry manages OPEN/HALF_OPEN/CLOSED states.
  registerCircuitBreaker(name: string): {
    execute<T>(operation: () => Promise<T>): Promise<T>;
    getState(): { state: "CLOSED" | "OPEN" | "HALF_OPEN"; failures: number };
  };

  // ========================================================================
  // SMT Throttler Access
  // ========================================================================
  // Extensions check if operations can proceed.
  // UNTHROTTLED operations (identity, audit, health, kill) always pass.
  canProceed(operation: string, category?: string): boolean;
  recordUsage(operation: string): void;

  // ========================================================================
  // Persona Executor Registration
  // ========================================================================
  // Extensions register persona executors to handle tasks.
  // Multiple executors can be registered; router picks the right one.
  registerPersonaExecutor(persona: string, executor: PersonaExecutor): void;

  // ========================================================================
  // Identity Store Access (READ-ONLY)
  // ========================================================================
  // Extensions can read identity context for persona execution.
  // Extensions CANNOT write to identity (only extraction pipeline).
  getIdentityStore(): {
    search(query: string, options?: { limit?: number }): Promise<SearchResult[]>;
    getByCategory(category: string): Promise<IdentityFragment[]>;
  };

  // ========================================================================
  // Task Store Access
  // ========================================================================
  // Extensions can create/update tasks for their domain.
  getTaskStore(): {
    create(input: TaskCreateInput): Promise<Task>;
    update(taskId: string, input: TaskUpdateInput): Promise<Task | null>;
    get(taskId: string): Promise<Task | null>;
  };

  // ========================================================================
  // Audit Logging
  // ========================================================================
  // Extensions should audit significant actions.
  logAudit(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void>;

  // ========================================================================
  // Scheduler Access
  // ========================================================================
  // Extensions can trigger scheduler runs or pause/resume.
  triggerSchedulerTick(): void;
  pauseScheduler(reason: string): void;
  resumeScheduler(): void;
}

// ============================================================================
// Persona Executor Interface
// ============================================================================

/**
 * PersonaExecutor handles task execution for a specific persona.
 * Extensions implement this to provide task handling logic.
 */
export interface PersonaExecutor {
  persona: string;

  /**
   * Check if this executor can handle the task
   */
  canHandle(task: Task): boolean;

  /**
   * Execute the task
   */
  execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: ExtensionAuditLogEntry): Promise<void> };
    },
  ): Promise<ExecutorResult>;
}

// ============================================================================
// Executor Result
// ============================================================================

export interface ExecutorResult {
  success: boolean;
  outcome: string;
  summary: string;
  confidence: number;
  error?: string;
}

// ============================================================================
// Extension Config (inline definition)
// ============================================================================

interface ExtensionConfig {
  enabled: boolean;
  circuitBreaker?: {
    failureThreshold: number;
    cooldownMs: number;
  };
  smt?: {
    throttled: boolean;
    category?: string;
  };
  personaMapping?: Record<string, string>;
}

// ============================================================================
// Example: Extension Registration
// ============================================================================

/**
 * Example: How an extension registers with the foundation
 */
async function _registerExtension(
  foundation: ExtensionFoundation,
  _config: ExtensionConfig,
): Promise<void> {
  // 1. Register circuit breaker for external API
  foundation.registerCircuitBreaker("twilio");

  // 2. Register persona executor
  foundation.registerPersonaExecutor("Dev", {
    persona: "Dev",
    canHandle: (task) => task.category === "DEV",
    execute: async (_task, _context) => {
      // Implementation here
      return { success: true, outcome: "COMPLETED", summary: "Done", confidence: 1.0 };
    },
  });

  // 3. Use identity store (read-only)
  const identity = foundation.getIdentityStore();
  await identity.search("project goals", { limit: 5 });
}

// ============================================================================
// Extension Config Schema
// ============================================================================

export const ExtensionConfigSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean", default: true },
    circuitBreaker: {
      type: "object",
      properties: {
        failureThreshold: { type: "number", default: 5 },
        cooldownMs: { type: "number", default: 60000 },
      },
    },
    smt: {
      type: "object",
      properties: {
        throttled: { type: "boolean", default: true },
        category: { type: "string" },
      },
    },
    personaMapping: {
      type: "object",
      additionalProperties: { type: "string" },
    },
  },
};

// ============================================================================
// Extension Lifecycle
// ============================================================================

export interface ExtensionLifecycle {
  /**
   * Called when extension is loaded
   */
  initialize(foundation: ExtensionFoundation): Promise<void>;

  /**
   * Called when extension is unloaded
   */
  shutdown(): Promise<void>;

  /**
   * Called periodically for background work
   */
  tick(): Promise<void>;
}

// ============================================================================
// Integration Checklist for Extensions
// ============================================================================

/**
 * When building an extension, ensure:
 *
 * 1. [ ] Register circuit breaker for external APIs
 * 2. [ ] Register persona executor(s)
 * 3. [ ] Check SMT.canProceed() before expensive operations
 * 4. [ ] Use identity store for context (read-only)
 * 5. [ ] Use task store for task creation/updates
 * 6. [ ] Audit significant actions
 * 7. [ ] Handle circuit breaker OPEN state
 * 8. [ ] Respect kill switch (check foundation.paused)
 * 9. [ ] Implement ExtensionLifecycle (initialize, shutdown, tick)
 */
