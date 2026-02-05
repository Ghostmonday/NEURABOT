/**
 * Sowwy Mission Control - Task Store Interface Foundation
 *
 * ⚠️ DATA CONSISTENCY:
 * - All operations should be idempotent where possible
 * - Use transactions for multi-operation sequences
 * - Log before update (append-only audit)
 *
 * ⚠️ PERFORMANCE:
 * - getNextReady() is called every poll - optimize this query
 * - Index on: status + priority, createdAt, category, personaOwner
 * - Connection pooling is essential for PostgreSQL
 *
 * ⚠️ AUDIT REQUIREMENTS:
 * - Every state change is logged
 * - Include: who, what, when, why
 * - Never delete audit logs
 *
 * ⚠️ TRANSACTION PATTERN:
 * For task completion:
 * 1. BEGIN transaction
 * 2. UPDATE task status
 * 3. INSERT audit log
 * 4. COMMIT
 * If either fails, ROLLBACK
 */

import { PersonaOwner, Task, TaskCreateInput, TaskFilter, TaskUpdateInput } from "./schema.js";

// ============================================================================
// Task Store Interface
// ============================================================================

export interface TaskStore {
  // CRUD Operations
  create(input: TaskCreateInput): Promise<Task>;
  get(taskId: string): Promise<Task | null>;
  update(taskId: string, input: TaskUpdateInput): Promise<Task | null>;
  delete(taskId: string): Promise<boolean>;

  // Query Operations
  list(filter?: TaskFilter): Promise<Task[]>;
  getNextReady(filter?: { personaOwner?: PersonaOwner }): Promise<Task | null>;
  getByStatus(status: string): Promise<Task[]>;
  getByCategory(category: string): Promise<Task[]>;
  getByPersona(persona: string): Promise<Task[]>;

  // Priority Operations
  getHighestPriorityReady(): Promise<Task | null>;
  getHighestPriorityBacklog(): Promise<Task | null>;
  getStuckTasks(olderThanMs: number): Promise<Task[]>;

  // Count Operations
  count(filter?: TaskFilter): Promise<number>;
  countByStatus(): Promise<Record<string, number>>;
}

// ============================================================================
// Audit Log Entry
// ============================================================================

export interface AuditLogEntry {
  id: string;
  taskId: string;
  action: string;
  details: Record<string, unknown>;
  performedBy: string;
  createdAt: string;
}

// ============================================================================
// Audit Store Interface
// ============================================================================

export interface AuditStore {
  append(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry>;
  getByTaskId(taskId: string): Promise<AuditLogEntry[]>;
  getRecent(limit: number): Promise<AuditLogEntry[]>;
}

// ============================================================================
// Decision Log Entry
// ============================================================================

export interface DecisionLogEntry {
  id: string;
  taskId: string;
  decision: string;
  reasoning: string;
  confidence: number;
  personaUsed: string;
  outcome: string;
  createdAt: string;
}

// ============================================================================
// Decision Store Interface
// ============================================================================

export interface DecisionStore {
  log(entry: Omit<DecisionLogEntry, "id" | "createdAt">): Promise<DecisionLogEntry>;
  getByTaskId(taskId: string): Promise<DecisionLogEntry[]>;
  getRecent(limit: number): Promise<DecisionLogEntry[]>;
}

// ============================================================================
// Store Factory Type
// ============================================================================

export interface SowwyStores {
  tasks: TaskStore;
  audit: AuditStore;
  decisions: DecisionStore;
}

export type StoreFactory = () => Promise<SowwyStores>;
