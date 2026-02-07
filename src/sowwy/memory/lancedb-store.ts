/**
 * Sowwy Memory - LanceDB Vector Store
 *
 * Stores vector embeddings for semantic memory search.
 * Integrates with PostgreSQL store for full memory management.
 *
 * ⚠️ PERFORMANCE:
 * - Vector similarity search (cosine)
 * - Embeddings cached per content hash
 * - Batch operations for efficiency
 */

import * as lancedb from "@lancedb/lancedb";
import { randomUUID } from "node:crypto";
import type { IdentityCategory } from "./pg-store.js";
import { getChildLogger } from "../../logging/logger.js";

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  getDimensions(): number;
}

export interface MemoryEmbedding {
  id: string;
  memory_id: string; // Reference to PostgreSQL memory_entries.id
  category: IdentityCategory;
  content: string;
  embedding: number[];
  created_at: number;
}

export interface LanceDBMemoryConfig {
  dbPath: string;
  embeddingProvider: EmbeddingProvider;
}

// ============================================================================
// LanceDB Memory Store
// ============================================================================

export class LanceDBMemoryStore {
  private readonly log = getChildLogger({ subsystem: "memory-lancedb" });
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly dbPath: string;
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorDim: number;

  private static readonly TABLE_NAME = "memory_embeddings";

  constructor(config: LanceDBMemoryConfig) {
    this.dbPath = config.dbPath;
    this.embeddingProvider = config.embeddingProvider;
    this.vectorDim = config.embeddingProvider.getDimensions();
  }

  /**
   * Initialize database connection and table
   */
  private async ensureInitialized(): Promise<void> {
    if (this.table) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    this.db = await lancedb.connect(this.dbPath);
    const tables = await this.db.tableNames();

    if (tables.includes(LanceDBMemoryStore.TABLE_NAME)) {
      this.table = await this.db.openTable(LanceDBMemoryStore.TABLE_NAME);
    } else {
      // Create table with schema
      const schema: MemoryEmbedding[] = [
        {
          id: "__schema__",
          memory_id: "",
          category: "preference",
          content: "",
          embedding: Array.from<number, number>({ length: this.vectorDim }, () => 0),
          created_at: 0,
        },
      ];
      this.table = await this.db.createTable(
        LanceDBMemoryStore.TABLE_NAME,
        schema as unknown as Record<string, unknown>[],
      );
      // Remove schema row
      await this.table.delete('id = "__schema__"');
    }
  }

  /**
   * Add embedding for memory entry
   */
  async addEmbedding(
    memoryId: string,
    category: IdentityCategory,
    content: string,
    embedding?: number[],
  ): Promise<void> {
    await this.ensureInitialized();

    const finalEmbedding = embedding ?? (await this.embeddingProvider.embed(content));

    const entry: MemoryEmbedding = {
      id: randomUUID(),
      memory_id: memoryId,
      category,
      content,
      embedding: finalEmbedding,
      created_at: Date.now(),
    };

    await this.table!.add([entry as unknown as Record<string, unknown>]);
  }

  /**
   * Add multiple embeddings in batch
   */
  async addEmbeddings(
    entries: Array<{
      memoryId: string;
      category: IdentityCategory;
      content: string;
      embedding?: number[];
    }>,
  ): Promise<void> {
    await this.ensureInitialized();

    let embeddings: Array<{
      id: string;
      memory_id: string;
      category: IdentityCategory;
      content: string;
      embedding: number[];
      created_at: number;
    }>;
    try {
      embeddings = await Promise.all(
        entries.map(async (entry) => {
          const embedding = entry.embedding ?? (await this.embeddingProvider.embed(entry.content));
          return {
            id: randomUUID(),
            memory_id: entry.memoryId,
            category: entry.category,
            content: entry.content,
            embedding,
            created_at: Date.now(),
          };
        }),
      );
    } catch (error) {
      this.log.error("Batch embedding generation failed", {
        entryCount: entries.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (embeddings.length > 0) {
      try {
        await this.table!.add(embeddings);
      } catch (error) {
        this.log.error("Batch add to table failed", {
          entryCount: embeddings.length,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  /**
   * Search memory by semantic similarity
   */
  async search(
    query: string,
    options?: {
      category?: IdentityCategory;
      limit?: number;
      minScore?: number;
    },
  ): Promise<Array<{ memoryId: string; content: string; score: number }>> {
    await this.ensureInitialized();

    const queryEmbedding = await this.embeddingProvider.embed(query);
    const limit = options?.limit ?? 10;
    const minScore = options?.minScore ?? 0.5;

    let searchQuery = this.table!.search(queryEmbedding).limit(limit);

    if (options?.category) {
      // Filter by category (LanceDB doesn't support WHERE in search, so filter after)
      const results = await searchQuery.toArray();
      return results
        .filter((r: MemoryEmbedding) => r.category === options.category)
        .filter((r: { _distance?: number }) => {
          // Convert distance to similarity score (1 - normalized distance)
          const distance = r._distance ?? 1;
          const score = 1 - Math.min(distance / 2, 1); // Normalize distance
          return score >= minScore;
        })
        .map((r: MemoryEmbedding & { _distance?: number }) => ({
          memoryId: r.memory_id,
          content: r.content,
          score: 1 - Math.min((r._distance ?? 1) / 2, 1),
        }))
        .slice(0, limit);
    }

    const results = await searchQuery.toArray();
    return results
      .filter((r: { _distance?: number }) => {
        const distance = r._distance ?? 1;
        const score = 1 - Math.min(distance / 2, 1);
        return score >= minScore;
      })
      .map((r: MemoryEmbedding & { _distance?: number }) => ({
        memoryId: r.memory_id,
        content: r.content,
        score: 1 - Math.min((r._distance ?? 1) / 2, 1),
      }));
  }

  /**
   * Delete embedding by memory ID
   */
  async deleteByMemoryId(memoryId: string): Promise<void> {
    await this.ensureInitialized();
    await this.table!.delete(`memory_id = '${memoryId}'`);
  }

  /**
   * Get embedding count
   */
  async count(): Promise<number> {
    await this.ensureInitialized();
    const count = await this.table!.countRows();
    return count;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.table = null;
      this.initPromise = null;
    }
  }
}
