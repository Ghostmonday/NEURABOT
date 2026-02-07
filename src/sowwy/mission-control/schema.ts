/**
 * Sowwy Mission Control - Task Schema Foundation
 *
 * ⚠️ CRITICAL: Tasks are decisions, not just work units.
 * This design ensures auditability and future self-correction.
 *
 * PERFORMANCE NOTE: The calculatePriority function is called frequently.
 * Keep it lightweight. No database calls, no async operations.
 *
 * VALIDATION NOTE: validateTaskState is called on EVERY task update.
 * If validation fails, the task update fails. This is intentional.
 * Don't weaken validation to make tests pass - fix the data instead.
 */

import { Static, Type } from "@sinclair/typebox";

// ============================================================================

export const TaskCategory = {
  DEV: "DEV",
  LEGAL: "LEGAL",
  EMAIL: "EMAIL",
  ADMIN: "ADMIN",
  RESEARCH: "RESEARCH",
  RND: "RND",
  SMS: "SMS",
  MISSION_CONTROL: "MISSION_CONTROL",
  /** Continuous upgrade/validate cycles until human says stop (README §0.2). */
  SELF_MODIFY: "SELF_MODIFY",
  /** Fitness assessment tasks (README §0.4 - MANDATORY FIRMWARE). */
  FITNESS_CHECK: "FITNESS_CHECK",
  /** Rust validation tasks - cargo check, clippy, and speculative fixes. */
  RUST_CHECK: "RUST_CHECK",
  /** Auto-fix spawned for Rust compilation/clippy errors. */
  RUST_FIX: "RUST_FIX",
} as const;

export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

// ============================================================================
// Task Persona Owner Enum
// ============================================================================

export const PersonaOwner = {
  Dev: "Dev",
  LegalOps: "LegalOps",
  ChiefOfStaff: "ChiefOfStaff",
  RnD: "RnD",
} as const;

export type PersonaOwner = (typeof PersonaOwner)[keyof typeof PersonaOwner];

// ============================================================================
// Task Status Enum
// ============================================================================

export const TaskStatus = {
  BACKLOG: "BACKLOG",
  READY: "READY",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  WAITING_ON_HUMAN: "WAITING_ON_HUMAN",
  DONE: "DONE",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// ============================================================================
// Task Outcome Enum
// ============================================================================

export const TaskOutcome = {
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED",
  ABORTED: "ABORTED",
  REQUIRES_HUMAN: "REQUIRES_HUMAN",
  UNSAFE: "UNSAFE",
} as const;

export type TaskOutcome = (typeof TaskOutcome)[keyof typeof TaskOutcome];

// ============================================================================
// Main Task Schema
// ============================================================================

export const TaskSchema = Type.Object({
  taskId: Type.String({ format: "uuid" }),
  title: Type.String({ minLength: 1, maxLength: 500 }),
  description: Type.Optional(Type.String({ maxLength: 5000 })),
  category: Type.Enum(TaskCategory),
  personaOwner: Type.Enum(PersonaOwner),
  status: Type.Enum(TaskStatus),
  // CLOSURE SEMANTICS: Tasks are decisions, not just work units
  outcome: Type.Optional(Type.Enum(TaskOutcome)),
  decisionSummary: Type.Optional(Type.String({ maxLength: 5000 })),
  confidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  // Priority dimensions
  urgency: Type.Integer({ minimum: 1, maximum: 5 }),
  importance: Type.Integer({ minimum: 1, maximum: 5 }),
  risk: Type.Integer({ minimum: 1, maximum: 5 }),
  stressCost: Type.Integer({ minimum: 1, maximum: 5 }),
  // Approval and safety
  requiresApproval: Type.Boolean({ default: false }),
  approved: Type.Boolean({ default: false }),
  approvedBy: Type.Optional(Type.String()),
  // Time management
  dueBy: Type.Optional(Type.String({ format: "date-time" })),
  // SLA & ESCALATION: Time-based priority management
  slaHours: Type.Optional(Type.Number({ minimum: 0 })),
  escalationThreshold: Type.Optional(Type.Number({ minimum: 0 })),
  // Extension metadata
  command: Type.Optional(Type.String()),
  payload: Type.Optional(Type.Any()),
  // Retry management
  retryCount: Type.Integer({ default: 0 }),
  maxRetries: Type.Integer({ default: 3 }),
  lastRetryAt: Type.Optional(Type.String({ format: "date-time" })),
  // Dependencies and context
  dependencies: Type.Array(Type.String({ format: "uuid" }), { default: [] }),
  contextLinks: Type.Record(Type.String(), Type.String(), { default: {} }),
  // Metadata
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  createdBy: Type.String(),
  runId: Type.Optional(Type.String()),
});

export type Task = Static<typeof TaskSchema>;

// ============================================================================
// Task Creation Input (omit auto-generated fields)
// ============================================================================

export const TaskCreateInput = Type.Omit(TaskSchema, [
  "taskId",
  "status",
  "outcome",
  "decisionSummary",
  "confidence",
  "approved",
  "approvedBy",
  "retryCount",
  "lastRetryAt",
  "createdAt",
  "updatedAt",
  "runId",
]);

export type TaskCreateInput = Static<typeof TaskCreateInput>;

// ============================================================================
// Task Update Input (partial updates)
// ============================================================================

export const TaskUpdateInput = Type.Partial(
  Type.Omit(TaskSchema, ["taskId", "category", "personaOwner", "createdAt", "createdBy"]),
);

export type TaskUpdateInput = Static<typeof TaskUpdateInput>;

// ============================================================================
// Task Filter Options
// ============================================================================

export const TaskFilter = Type.Object({
  status: Type.Optional(Type.Enum(TaskStatus)),
  category: Type.Optional(Type.Enum(TaskCategory)),
  personaOwner: Type.Optional(Type.Enum(PersonaOwner)),
  priorityMin: Type.Optional(Type.Number()),
  requiresApproval: Type.Optional(Type.Boolean()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
});

export type TaskFilter = Static<typeof TaskFilter>;

// ============================================================================
// Priority Calculation
// ============================================================================

export const PRIORITY_WEIGHTS = {
  urgency: 2,
  importance: 2,
  risk: 1.5,
  stressCost: 1,
} as const;

export function calculatePriority(task: Task): number {
  let baseScore =
    task.urgency * PRIORITY_WEIGHTS.urgency +
    task.importance * PRIORITY_WEIGHTS.importance +
    task.risk * PRIORITY_WEIGHTS.risk -
    task.stressCost * PRIORITY_WEIGHTS.stressCost;

  // Escalation: Increase priority if task is aging
  if (task.escalationThreshold && task.createdAt) {
    const ageHours = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > task.escalationThreshold) {
      const escalationMultiplier = Math.floor(ageHours / task.escalationThreshold);
      baseScore += escalationMultiplier * 2; // +2 per threshold period
    }
  }

  // Retry penalty: Slightly reduce priority for retried tasks (but still process)
  if (task.retryCount > 0) {
    baseScore -= task.retryCount * 0.5;
  }

  return baseScore;
}

// ============================================================================
// Task State Invariants
// ============================================================================

export function validateTaskState(task: Task): void {
  // DONE tasks must have outcome
  if (task.status === "DONE" && !task.outcome) {
    throw new Error("DONE tasks must have outcome");
  }

  // REQUIRES_HUMAN outcome must have WAITING_ON_HUMAN status
  if (task.outcome === "REQUIRES_HUMAN" && task.status !== "WAITING_ON_HUMAN") {
    throw new Error("REQUIRES_HUMAN outcome must have WAITING_ON_HUMAN status");
  }

  // DONE tasks must have decisionSummary
  if (task.status === "DONE" && !task.decisionSummary) {
    throw new Error("DONE tasks must have decisionSummary");
  }
}

// ============================================================================
// Valid Status Transitions
// ============================================================================

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  BACKLOG: ["READY"],
  READY: ["IN_PROGRESS", "BLOCKED", "WAITING_ON_HUMAN"],
  IN_PROGRESS: ["DONE", "BLOCKED", "WAITING_ON_HUMAN"],
  BLOCKED: ["READY", "WAITING_ON_HUMAN"],
  WAITING_ON_HUMAN: ["READY", "BLOCKED"],
  DONE: [], // Terminal state
};

export function isValidTransition(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}
