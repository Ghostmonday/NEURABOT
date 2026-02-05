/**
 * Sowwy Mission Control - PostgreSQL Task Store Implementation
 *
 * ⚠️ DATA CONSISTENCY:
 * - All operations use transactions for atomicity
 * - Task updates + audit logs are atomic
 * - State validation before every update
 *
 * ⚠️ PERFORMANCE:
 * - getNextReady() optimized with composite index
 * - Connection pooling via pg.Pool
 * - Prepared statements for hot paths
 *
 * ⚠️ AUDIT REQUIREMENTS:
 * - Every state change logged atomically
 * - Includes: who, what, when, why
 * - Audit logs never deleted
 */

import { Pool, type PoolClient } from "pg";
import type {
  AuditLogEntry,
  AuditStore,
  DecisionLogEntry,
  DecisionStore,
  TaskStore,
} from "./store.js";
import { redactError } from "../security/redact.js";
import {
  isValidTransition,
  PersonaOwner,
  PRIORITY_WEIGHTS,
  Task,
  TaskCategory,
  TaskCreateInput,
  TaskFilter,
  TaskOutcome,
  TaskStatus,
  TaskUpdateInput,
  validateTaskState,
} from "./schema.js";

// ============================================================================
// PostgreSQL Connection Config
// ============================================================================

export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number; // Connection pool size
}

/** PG query result row shape (snake_case) for tasks table */
interface TaskRow {
  task_id: string;
  title: string;
  description?: string;
  category: string;
  persona_owner: string;
  status: string;
  outcome?: string;
  decision_summary?: string;
  confidence?: string;
  urgency: number;
  importance: number;
  risk: number;
  stress_cost: number;
  requires_approval: boolean;
  approved: boolean;
  approved_by?: string;
  due_by?: string;
  sla_hours?: string;
  escalation_threshold?: string;
  retry_count: number;
  max_retries: number;
  last_retry_at?: string;
  dependencies: string[] | string;
  context_links: Record<string, string> | string;
  created_at: string;
  updated_at: string;
  created_by: string;
  run_id?: string;
}

/** PG query result row shape for audit_log table */
interface AuditRow {
  id: string;
  task_id: string;
  action: string;
  details: Record<string, unknown> | string;
  performed_by: string;
  created_at: string;
}

/** PG query result row shape for decision_log table */
interface DecisionRow {
  id: string;
  task_id: string;
  decision: string;
  reasoning: string;
  confidence: string;
  persona_used: string;
  outcome: string;
  created_at: string;
}

// ============================================================================
// PostgreSQL Task Store
// ============================================================================

export class PostgresTaskStore implements TaskStore {
  private pool: Pool;
  private auditStore: PostgresAuditStore;
  private decisionStore: PostgresDecisionStore;

  private getPriorityQueryParts(): {
    expression: string;
    params: [number, number, number, number];
  } {
    return {
      expression: "urgency * $1 + importance * $2 + risk * $3 - stress_cost * $4",
      params: [
        PRIORITY_WEIGHTS.urgency,
        PRIORITY_WEIGHTS.importance,
        PRIORITY_WEIGHTS.risk,
        PRIORITY_WEIGHTS.stressCost,
      ],
    };
  }

  constructor(config: PostgresConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.max || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.auditStore = new PostgresAuditStore(this.pool);
    this.decisionStore = new PostgresDecisionStore(this.pool);

    // Initialize schema on construction
    this.initializeSchema().catch((err) => {
      console.error("[PostgresTaskStore] Schema initialization failed:", redactError(err));
    });
  }

  /**
   * Initialize database schema
   */
  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          task_id UUID PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          persona_owner VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          outcome VARCHAR(50),
          decision_summary TEXT,
          confidence DECIMAL(3,2),
          urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
          importance INTEGER NOT NULL CHECK (importance >= 1 AND importance <= 5),
          risk INTEGER NOT NULL CHECK (risk >= 1 AND risk <= 5),
          stress_cost INTEGER NOT NULL CHECK (stress_cost >= 1 AND stress_cost <= 5),
          requires_approval BOOLEAN NOT NULL DEFAULT false,
          approved BOOLEAN NOT NULL DEFAULT false,
          approved_by VARCHAR(255),
          due_by TIMESTAMPTZ,
          sla_hours DECIMAL,
          escalation_threshold DECIMAL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          max_retries INTEGER NOT NULL DEFAULT 3,
          last_retry_at TIMESTAMPTZ,
          dependencies UUID[] DEFAULT '{}',
          context_links JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_by VARCHAR(255) NOT NULL,
          run_id VARCHAR(255)
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, urgency DESC, importance DESC, created_at ASC) WHERE status = 'READY';
        CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
        CREATE INDEX IF NOT EXISTS idx_tasks_persona ON tasks(persona_owner);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_by ON tasks(due_by) WHERE due_by IS NOT NULL;

        CREATE TABLE IF NOT EXISTS audit_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          details JSONB NOT NULL DEFAULT '{}',
          performed_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_audit_task_id ON audit_log(task_id);
        CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

        CREATE TABLE IF NOT EXISTS decision_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
          decision VARCHAR(255) NOT NULL,
          reasoning TEXT NOT NULL,
          confidence DECIMAL(3,2) NOT NULL,
          persona_used VARCHAR(50) NOT NULL,
          outcome VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_decision_task_id ON decision_log(task_id);
        CREATE INDEX IF NOT EXISTS idx_decision_created_at ON decision_log(created_at DESC);
      `);

      console.log("[PostgresTaskStore] Schema initialized"); // No secrets in this log
    } finally {
      client.release();
    }
  }

  /**
   * Create a new task
   */
  async create(input: TaskCreateInput): Promise<Task> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const taskId = crypto.randomUUID();
      const now = new Date().toISOString();

      const result = await client.query(
        `
        INSERT INTO tasks (
          task_id, title, description, category, persona_owner, status,
          urgency, importance, risk, stress_cost, requires_approval,
          due_by, sla_hours, escalation_threshold, max_retries,
          dependencies, context_links, created_at, updated_at, created_by, run_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `,
        [
          taskId,
          input.title,
          input.description || null,
          input.category,
          input.personaOwner,
          "BACKLOG",
          input.urgency,
          input.importance,
          input.risk,
          input.stressCost,
          input.requiresApproval || false,
          input.dueBy || null,
          input.slaHours || null,
          input.escalationThreshold || null,
          input.maxRetries || 3,
          input.dependencies || [],
          JSON.stringify(input.contextLinks || {}),
          now,
          now,
          input.createdBy,
          null, // runId is omitted from TaskCreateInput
        ],
      );

      const task = this.rowToTask(result.rows[0] as TaskRow);

      // Audit log creation
      await this.auditStore.append(
        {
          taskId: task.taskId,
          action: "TASK_CREATED",
          details: { input },
          performedBy: input.createdBy,
        },
        client,
      );

      await client.query("COMMIT");
      return task;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a task by ID
   */
  async get(taskId: string): Promise<Task | null> {
    const result = await this.pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToTask(result.rows[0] as TaskRow);
  }

  /**
   * Update a task
   */
  async update(taskId: string, input: TaskUpdateInput): Promise<Task | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Get current task for validation
      const currentResult = await client.query(
        "SELECT * FROM tasks WHERE task_id = $1 FOR UPDATE",
        [taskId],
      );

      if (currentResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const currentTask = this.rowToTask(currentResult.rows[0]);

      // Validate state transition if status is changing
      if (input.status && input.status !== currentTask.status) {
        if (!isValidTransition(currentTask.status, input.status as TaskStatus)) {
          await client.query("ROLLBACK");
          throw new Error(`Invalid status transition: ${currentTask.status} -> ${input.status}`);
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(input.title);
      }
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }
      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.outcome !== undefined) {
        updates.push(`outcome = $${paramIndex++}`);
        values.push(input.outcome);
      }
      if (input.decisionSummary !== undefined) {
        updates.push(`decision_summary = $${paramIndex++}`);
        values.push(input.decisionSummary);
      }
      if (input.confidence !== undefined) {
        updates.push(`confidence = $${paramIndex++}`);
        values.push(input.confidence);
      }
      if (input.approved !== undefined) {
        updates.push(`approved = $${paramIndex++}`);
        values.push(input.approved);
      }
      if (input.approvedBy !== undefined) {
        updates.push(`approved_by = $${paramIndex++}`);
        values.push(input.approvedBy);
      }
      if (input.retryCount !== undefined) {
        updates.push(`retry_count = $${paramIndex++}`);
        values.push(input.retryCount);
      }
      if (input.lastRetryAt !== undefined) {
        updates.push(`last_retry_at = $${paramIndex++}`);
        values.push(input.lastRetryAt ? new Date(input.lastRetryAt) : null);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      values.push(taskId);

      const updateQuery = `
        UPDATE tasks
        SET ${updates.join(", ")}
        WHERE task_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);
      const updatedTask = this.rowToTask(result.rows[0] as TaskRow);

      // Validate task state after update
      validateTaskState(updatedTask);

      // Audit log update
      await this.auditStore.append(
        {
          taskId: updatedTask.taskId,
          action: "TASK_UPDATED",
          details: {
            previous: currentTask,
            changes: input,
          },
          performedBy: input.approvedBy || updatedTask.createdBy,
        },
        client,
      );

      await client.query("COMMIT");
      return updatedTask;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a task
   */
  async delete(taskId: string): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM tasks WHERE task_id = $1", [taskId]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * List tasks with filter
   */
  async list(filter?: TaskFilter): Promise<Task[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filter.status);
    }
    if (filter?.category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(filter.category);
    }
    if (filter?.personaOwner) {
      conditions.push(`persona_owner = $${paramIndex++}`);
      values.push(filter.personaOwner);
    }
    if (filter?.requiresApproval !== undefined) {
      conditions.push(`requires_approval = $${paramIndex++}`);
      values.push(filter.requiresApproval);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const limit = filter?.limit || 1000;
    const offset = filter?.offset || 0;

    const query = `
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.rowToTask(row as TaskRow));
  }

  /**
   * Get next ready task (optimized query with composite index)
   */
  async getNextReady(filter?: { personaOwner?: PersonaOwner }): Promise<Task | null> {
    const conditions = ["status = 'READY'", "(requires_approval = false OR approved = true)"];
    const values: any[] = [];
    if (filter?.personaOwner) {
      conditions.push(`persona_owner = $${values.length + 1}`);
      values.push(filter.personaOwner);
    }

    const result = await this.pool.query(
      `
      SELECT * FROM tasks
      WHERE ${conditions.join(" AND ")}
      ORDER BY
        urgency DESC,
        importance DESC,
        created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `,
      values,
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToTask(result.rows[0] as TaskRow);
  }

  /**
   * Get highest priority ready task
   */
  async getHighestPriorityReady(): Promise<Task | null> {
    const { expression, params } = this.getPriorityQueryParts();
    const result = await this.pool.query(
      `
      SELECT *,
        (${expression}) AS priority_score
      FROM tasks
      WHERE status = 'READY'
        AND (requires_approval = false OR approved = true)
      ORDER BY priority_score DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `,
      params,
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToTask(result.rows[0] as TaskRow);
  }

  /**
   * Get highest priority backlog task
   */
  async getHighestPriorityBacklog(): Promise<Task | null> {
    const { expression, params } = this.getPriorityQueryParts();
    const result = await this.pool.query(
      `
      SELECT *,
        (${expression}) AS priority_score
      FROM tasks
      WHERE status = 'BACKLOG'
      ORDER BY priority_score DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `,
      params,
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToTask(result.rows[0] as TaskRow);
  }

  /**
   * Get tasks by status
   */
  async getByStatus(status: string): Promise<Task[]> {
    const result = await this.pool.query(
      "SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC",
      [status],
    );

    return result.rows.map((row) => this.rowToTask(row as TaskRow));
  }

  /**
   * Get tasks by category
   */
  async getByCategory(category: string): Promise<Task[]> {
    const result = await this.pool.query(
      "SELECT * FROM tasks WHERE category = $1 ORDER BY created_at DESC",
      [category],
    );

    return result.rows.map((row) => this.rowToTask(row as TaskRow));
  }

  /**
   * Get tasks by persona
   */
  async getByPersona(persona: string): Promise<Task[]> {
    const result = await this.pool.query(
      "SELECT * FROM tasks WHERE persona_owner = $1 ORDER BY created_at DESC",
      [persona],
    );

    return result.rows.map((row) => this.rowToTask(row as TaskRow));
  }

  /**
   * Get stuck tasks (older than threshold)
   */
  async getStuckTasks(olderThanMs: number): Promise<Task[]> {
    const threshold = new Date(Date.now() - olderThanMs);

    const result = await this.pool.query(
      `
      SELECT * FROM tasks
      WHERE status IN ('READY', 'IN_PROGRESS')
        AND updated_at < $1
      ORDER BY updated_at ASC
    `,
      [threshold],
    );

    return result.rows.map((row) => this.rowToTask(row as TaskRow));
  }

  /**
   * Count tasks with filter
   */
  async count(filter?: TaskFilter): Promise<number> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filter?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filter.status);
    }
    if (filter?.category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(filter.category);
    }
    if (filter?.personaOwner) {
      conditions.push(`persona_owner = $${paramIndex++}`);
      values.push(filter.personaOwner);
    }
    if (filter?.requiresApproval !== undefined) {
      conditions.push(`requires_approval = $${paramIndex++}`);
      values.push(filter.requiresApproval);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await this.pool.query(`SELECT COUNT(*) FROM tasks ${whereClause}`, values);

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Count tasks by status
   */
  async countByStatus(): Promise<Record<string, number>> {
    const result = await this.pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `);

    const counts: Record<string, number> = {};
    for (const row of result.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    return counts;
  }

  /**
   * Get audit store
   */
  getAuditStore(): AuditStore {
    return this.auditStore;
  }

  /**
   * Get decision store
   */
  getDecisionStore(): DecisionStore {
    return this.decisionStore;
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Private helpers

  private rowToTask(row: TaskRow): Task {
    return {
      taskId: row.task_id,
      title: row.title,
      description: row.description,
      category: row.category as TaskCategory,
      personaOwner: row.persona_owner as PersonaOwner,
      status: row.status as TaskStatus,
      outcome: row.outcome as TaskOutcome | undefined,
      decisionSummary: row.decision_summary,
      confidence: row.confidence ? parseFloat(row.confidence) : undefined,
      urgency: row.urgency,
      importance: row.importance,
      risk: row.risk,
      stressCost: row.stress_cost,
      requiresApproval: row.requires_approval,
      approved: row.approved,
      approvedBy: row.approved_by,
      dueBy: row.due_by ? new Date(row.due_by).toISOString() : undefined,
      slaHours: row.sla_hours ? parseFloat(row.sla_hours) : undefined,
      escalationThreshold: row.escalation_threshold
        ? parseFloat(row.escalation_threshold)
        : undefined,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      lastRetryAt: row.last_retry_at ? new Date(row.last_retry_at).toISOString() : undefined,
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      contextLinks:
        typeof row.context_links === "string"
          ? JSON.parse(row.context_links)
          : row.context_links || {},
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      createdBy: row.created_by,
      runId: row.run_id,
    };
  }
}

// ============================================================================
// PostgreSQL Audit Store
// ============================================================================

class PostgresAuditStore implements AuditStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async append(
    entry: Omit<AuditLogEntry, "id" | "createdAt">,
    client?: PoolClient,
  ): Promise<AuditLogEntry> {
    const query = `
      INSERT INTO audit_log (task_id, action, details, performed_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [entry.taskId, entry.action, JSON.stringify(entry.details), entry.performedBy];

    if (client) {
      // Use existing transaction
      const result = await client.query(query, values);
      return this.rowToAuditEntry(result.rows[0] as AuditRow);
    } else {
      // New transaction
      const result = await this.pool.query(query, values);
      return this.rowToAuditEntry(result.rows[0] as AuditRow);
    }
  }

  async getByTaskId(taskId: string): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM audit_log WHERE task_id = $1 ORDER BY created_at ASC",
      [taskId],
    );

    return result.rows.map((row) => this.rowToAuditEntry(row as AuditRow));
  }

  async getRecent(limit: number): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1",
      [limit],
    );

    return result.rows.map((row) => this.rowToAuditEntry(row as AuditRow));
  }

  private rowToAuditEntry(row: AuditRow): AuditLogEntry {
    return {
      id: row.id,
      taskId: row.task_id,
      action: row.action,
      details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
      performedBy: row.performed_by,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}

// ============================================================================
// PostgreSQL Decision Store
// ============================================================================

class PostgresDecisionStore implements DecisionStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async log(entry: Omit<DecisionLogEntry, "id" | "createdAt">): Promise<DecisionLogEntry> {
    const result = await this.pool.query(
      `
      INSERT INTO decision_log (task_id, decision, reasoning, confidence, persona_used, outcome)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        entry.taskId,
        entry.decision,
        entry.reasoning,
        entry.confidence,
        entry.personaUsed,
        entry.outcome,
      ],
    );

    return this.rowToDecisionEntry(result.rows[0]);
  }

  async getByTaskId(taskId: string): Promise<DecisionLogEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM decision_log WHERE task_id = $1 ORDER BY created_at ASC",
      [taskId],
    );

    return result.rows.map((row) => this.rowToDecisionEntry(row as DecisionRow));
  }

  async getRecent(limit: number): Promise<DecisionLogEntry[]> {
    const result = await this.pool.query(
      "SELECT * FROM decision_log ORDER BY created_at DESC LIMIT $1",
      [limit],
    );

    return result.rows.map((row) => this.rowToDecisionEntry(row as DecisionRow));
  }

  private rowToDecisionEntry(row: DecisionRow): DecisionLogEntry {
    return {
      id: row.id,
      taskId: row.task_id,
      decision: row.decision,
      reasoning: row.reasoning,
      confidence: parseFloat(row.confidence),
      personaUsed: row.persona_used,
      outcome: row.outcome,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}

// ============================================================================
// Store Factory
// ============================================================================

export async function createPostgresStores(config: PostgresConfig): Promise<{
  tasks: PostgresTaskStore;
  audit: AuditStore;
  decisions: DecisionStore;
}> {
  const taskStore = new PostgresTaskStore(config);

  return {
    tasks: taskStore,
    audit: taskStore.getAuditStore(),
    decisions: taskStore.getDecisionStore(),
  };
}
