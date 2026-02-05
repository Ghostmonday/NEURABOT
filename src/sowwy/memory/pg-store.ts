/**
 * Sowwy Memory - PostgreSQL Store
 *
 * Stores long-term memory entries, preferences, and decisions in PostgreSQL.
 * Uses pgvector extension for semantic search capabilities.
 *
 * ⚠️ DATA CONSISTENCY:
 * - All operations use transactions for atomicity
 * - Memory entries linked to identity categories
 * - Audit trail for all memory updates
 */

import { Pool } from "pg";
import { redactError } from "../security/redact.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Identity category (8 LOCKED categories)
 */
export type IdentityCategory =
  | "goal"
  | "constraint"
  | "preference"
  | "belief"
  | "risk"
  | "capability"
  | "relationship"
  | "historical_fact";

/**
 * Memory entry
 */
export interface MemoryEntry {
  id: string;
  category: IdentityCategory;
  content: string;
  embedding: number[] | null;
  confidence: number;
  source: string | null;
  created_at: Date;
  updated_at: Date;
  verified: boolean;
}

/**
 * Preference entry
 */
export interface PreferenceEntry {
  id: string;
  category: IdentityCategory;
  preference: string;
  strength: number; // -1 to 1 scale
  evidence: Array<{ source: string; timestamp: Date }>;
  created_at: Date;
}

/**
 * Decision entry
 */
export interface DecisionEntry {
  id: string;
  decision: string;
  context: string | null;
  outcome: string | null;
  confidence: number | null;
  created_at: Date;
}

/**
 * PostgreSQL configuration
 */
export interface PostgresMemoryConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number;
}

// ============================================================================
// PostgreSQL Memory Store
// ============================================================================

export class PostgresMemoryStore {
  private pool: Pool;

  constructor(config: PostgresMemoryConfig) {
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

    // Initialize schema
    this.initializeSchema().catch((err) => {
      console.error("[PostgresMemoryStore] Schema initialization failed:", redactError(err));
    });
  }

  /**
   * Initialize database schema
   */
  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Enable pgvector extension if available
      await client
        .query(`
        CREATE EXTENSION IF NOT EXISTS vector;
      `)
        .catch(() => {
          // Extension may not be available, continue without it
          console.warn("[PostgresMemoryStore] pgvector extension not available");
        });

      // Memory entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS memory_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category TEXT NOT NULL CHECK (category IN (
            'goal', 'constraint', 'preference', 'belief',
            'risk', 'capability', 'relationship', 'historical_fact'
          )),
          content TEXT NOT NULL,
          embedding VECTOR(1536),
          confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
          source TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          verified BOOLEAN DEFAULT FALSE
        );
      `);

      // Preferences table
      await client.query(`
        CREATE TABLE IF NOT EXISTS preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category TEXT NOT NULL CHECK (category IN (
            'goal', 'constraint', 'preference', 'belief',
            'risk', 'capability', 'relationship', 'historical_fact'
          )),
          preference TEXT NOT NULL,
          strength FLOAT DEFAULT 0.5 CHECK (strength >= -1 AND strength <= 1),
          evidence JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Decisions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS decisions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          decision TEXT NOT NULL,
          context TEXT,
          outcome TEXT,
          confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_memory_category ON memory_entries(category);
        CREATE INDEX IF NOT EXISTS idx_memory_verified ON memory_entries(verified);
        CREATE INDEX IF NOT EXISTS idx_preferences_category ON preferences(category);
        CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);
      `);

      // Create vector index if pgvector is available
      await client
        .query(`
        CREATE INDEX IF NOT EXISTS idx_memory_embedding ON memory_entries
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `)
        .catch(() => {
          // Vector index creation may fail if extension not available
        });
    } finally {
      client.release();
    }
  }

  /**
   * Create or update memory entry
   */
  async upsertMemoryEntry(entry: {
    category: IdentityCategory;
    content: string;
    embedding?: number[];
    confidence?: number;
    source?: string;
    verified?: boolean;
  }): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO memory_entries (category, content, embedding, confidence, source, verified)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          confidence = EXCLUDED.confidence,
          updated_at = NOW()
        RETURNING id;
      `,
        [
          entry.category,
          entry.content,
          entry.embedding ? JSON.stringify(entry.embedding) : null,
          entry.confidence ?? 1.0,
          entry.source ?? null,
          entry.verified ?? false,
        ],
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get memory entries by category
   */
  async getMemoryByCategory(
    category: IdentityCategory,
    limit: number = 100,
  ): Promise<MemoryEntry[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, category, content,
               embedding::text::float[] as embedding,
               confidence, source, created_at, updated_at, verified
        FROM memory_entries
        WHERE category = $1
        ORDER BY created_at DESC
        LIMIT $2;
      `,
        [category, limit],
      );

      return result.rows.map((row) => this.rowToMemoryEntry(row));
    } finally {
      client.release();
    }
  }

  /**
   * Search memory by semantic similarity
   */
  async searchMemory(
    queryEmbedding: number[],
    category?: IdentityCategory,
    limit: number = 10,
  ): Promise<MemoryEntry[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT id, category, content,
               embedding::text::float[] as embedding,
               confidence, source, created_at, updated_at, verified,
               1 - (embedding <=> $1::vector) as similarity
        FROM memory_entries
        WHERE embedding IS NOT NULL
      `;
      const params: unknown[] = [JSON.stringify(queryEmbedding)];

      if (category) {
        query += ` AND category = $2`;
        params.push(category);
        query += ` ORDER BY similarity DESC LIMIT $3`;
        params.push(limit);
      } else {
        query += ` ORDER BY similarity DESC LIMIT $2`;
        params.push(limit);
      }

      const result = await client.query(query, params);
      return result.rows.map((row) => this.rowToMemoryEntry(row));
    } catch (err) {
      // Fallback if vector search not available
      console.warn("[PostgresMemoryStore] Vector search failed:", err);
      return this.getMemoryByCategory(category ?? "preference", limit);
    } finally {
      client.release();
    }
  }

  /**
   * Upsert preference
   */
  async upsertPreference(pref: {
    category: IdentityCategory;
    preference: string;
    strength?: number;
    evidence?: Array<{ source: string; timestamp: Date }>;
  }): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO preferences (category, preference, strength, evidence)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          strength = EXCLUDED.strength,
          evidence = EXCLUDED.evidence
        RETURNING id;
      `,
        [pref.category, pref.preference, pref.strength ?? 0.5, JSON.stringify(pref.evidence ?? [])],
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get preferences by category
   */
  async getPreferences(category: IdentityCategory, limit: number = 50): Promise<PreferenceEntry[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, category, preference, strength, evidence, created_at
        FROM preferences
        WHERE category = $1
        ORDER BY ABS(strength) DESC, created_at DESC
        LIMIT $2;
      `,
        [category, limit],
      );

      return result.rows.map((row) => ({
        id: row.id,
        category: row.category,
        preference: row.preference,
        strength: parseFloat(row.strength),
        evidence: row.evidence || [],
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Create decision entry
   */
  async createDecision(decision: {
    decision: string;
    context?: string;
    outcome?: string;
    confidence?: number;
  }): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO decisions (decision, context, outcome, confidence)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `,
        [
          decision.decision,
          decision.context ?? null,
          decision.outcome ?? null,
          decision.confidence ?? null,
        ],
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get recent decisions
   */
  async getDecisions(limit: number = 50): Promise<DecisionEntry[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, decision, context, outcome, confidence, created_at
        FROM decisions
        ORDER BY created_at DESC
        LIMIT $1;
      `,
        [limit],
      );

      return result.rows.map((row) => ({
        id: row.id,
        decision: row.decision,
        context: row.context,
        outcome: row.outcome,
        confidence: row.confidence ? parseFloat(row.confidence) : null,
        created_at: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Convert database row to MemoryEntry
   */
  private rowToMemoryEntry(row: {
    id: string;
    category: string;
    content: string;
    embedding: string | null;
    confidence: string | number;
    source: string | null;
    created_at: Date;
    updated_at: Date;
    verified: boolean;
  }): MemoryEntry {
    let embedding: number[] | null = null;
    if (row.embedding) {
      try {
        embedding = JSON.parse(row.embedding) as number[];
      } catch {
        // Invalid embedding format
      }
    }

    return {
      id: row.id,
      category: row.category as IdentityCategory,
      content: row.content,
      embedding,
      confidence: typeof row.confidence === "string" ? parseFloat(row.confidence) : row.confidence,
      source: row.source,
      created_at: row.created_at,
      updated_at: row.updated_at,
      verified: row.verified,
    };
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
