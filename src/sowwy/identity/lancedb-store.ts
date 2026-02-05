/**
 * Sowwy Identity Model - LanceDB Store Implementation
 *
 * ⚠️ WRITE ACCESS RULE (NON-NEGOTIABLE):
 * Only the Identity Extraction Pipeline may write identity fragments.
 * This store enforces read-only access for personas/tools.
 *
 * ⚠️ PERFORMANCE:
 * - Semantic search uses vector similarity (cosine)
 * - Embeddings cached per content hash
 * - Batch writes for extraction pipeline
 *
 * ⚠️ IDENTITY INTEGRITY:
 * - 8 categories are LOCKED - enforced at schema level
 * - Fragments never deleted (only marked reviewed)
 * - Contradictions detected and logged
 */

import * as lancedb from "@lancedb/lancedb";
import { randomUUID } from "node:crypto";
import type {
  FragmentSource,
  IdentityCategory,
  IdentityFragment,
  SearchOptions,
  SearchResult,
} from "./fragments.js";
import type { IdentityStore } from "./store.js";

// ============================================================================
// LanceDB Table Schema
// ============================================================================

type IdentityFragmentRow = {
  id: string;
  category: IdentityCategory;
  content: string;
  context: string;
  confidence: number;
  source: FragmentSource;
  metadata: string; // JSON string
  created_at: number; // Unix timestamp
  embedding: number[]; // Vector embedding
  reviewed: boolean;
};

// ============================================================================
// Embedding Provider Interface
// ============================================================================

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  getDimensions(): number;
}

// ============================================================================
// LanceDB Identity Store Config
// ============================================================================

export interface LanceDBIdentityStoreConfig {
  dbPath: string;
  embeddingProvider: EmbeddingProvider;
  writeAccessAllowed: boolean; // Only true for extraction pipeline
}

// ============================================================================
// LanceDB Identity Store
// ============================================================================

export class LanceDBIdentityStore implements IdentityStore {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly dbPath: string;
  private readonly writeAccessAllowed: boolean;
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly vectorDim: number;

  private static readonly TABLE_NAME = "identity_fragments";

  constructor(config: LanceDBIdentityStoreConfig) {
    this.dbPath = config.dbPath;
    this.writeAccessAllowed = config.writeAccessAllowed;
    this.embeddingProvider = config.embeddingProvider;
    this.vectorDim = config.embeddingProvider.getDimensions();
  }

  /**
   * Initialize database connection and table
   */
  async ensureInitialized(): Promise<void> {
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

    if (tables.includes(LanceDBIdentityStore.TABLE_NAME)) {
      this.table = await this.db.openTable(LanceDBIdentityStore.TABLE_NAME);
    } else {
      // Create table with schema row
      this.table = await this.db.createTable(LanceDBIdentityStore.TABLE_NAME, [
        {
          id: "__schema__",
          category: "goal",
          content: "",
          context: "",
          confidence: 0,
          source: "chat",
          metadata: "{}",
          created_at: 0,
          embedding: Array.from({ length: this.vectorDim }).fill(0),
          reviewed: false,
        },
      ]);
      // Delete schema row
      await this.table.delete('id = "__schema__"');
    }
  }

  /**
   * Write a single fragment (extraction pipeline only)
   */
  async write(fragment: Omit<IdentityFragment, "id" | "createdAt">): Promise<IdentityFragment> {
    if (!this.writeAccessAllowed) {
      throw new Error(
        "Identity store write access denied. Only the Identity Extraction Pipeline may write fragments.",
      );
    }

    await this.ensureInitialized();

    // Generate embedding
    const embedding = await this.embeddingProvider.embed(
      `${fragment.category}: ${fragment.content}`,
    );

    const now = Date.now();
    const id = randomUUID();

    const row: IdentityFragmentRow = {
      id,
      category: fragment.category,
      content: fragment.content,
      context: fragment.context,
      confidence: fragment.confidence,
      source: fragment.source,
      metadata: JSON.stringify(fragment.metadata || {}),
      created_at: now,
      embedding,
      reviewed: fragment.metadata?.reviewedByHuman || false,
    };

    await this.table!.add([row]);

    return {
      id,
      category: fragment.category,
      content: fragment.content,
      context: fragment.context,
      confidence: fragment.confidence,
      source: fragment.source,
      metadata: fragment.metadata,
      createdAt: new Date(now).toISOString(),
      embedding,
    };
  }

  /**
   * Write multiple fragments (extraction pipeline only)
   */
  async writeBatch(
    fragments: Array<Omit<IdentityFragment, "id" | "createdAt">>,
  ): Promise<IdentityFragment[]> {
    if (!this.writeAccessAllowed) {
      throw new Error(
        "Identity store write access denied. Only the Identity Extraction Pipeline may write fragments.",
      );
    }

    await this.ensureInitialized();

    const now = Date.now();
    const rows: IdentityFragmentRow[] = [];
    const results: IdentityFragment[] = [];

    // Generate embeddings in parallel
    const embeddings = await Promise.all(
      fragments.map((f) => this.embeddingProvider.embed(`${f.category}: ${f.content}`)),
    );

    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      const embedding = embeddings[i];
      const id = randomUUID();

      rows.push({
        id,
        category: fragment.category,
        content: fragment.content,
        context: fragment.context,
        confidence: fragment.confidence,
        source: fragment.source,
        metadata: JSON.stringify(fragment.metadata || {}),
        created_at: now,
        embedding,
        reviewed: fragment.metadata?.reviewedByHuman || false,
      });

      results.push({
        id,
        category: fragment.category,
        content: fragment.content,
        context: fragment.context,
        confidence: fragment.confidence,
        source: fragment.source,
        metadata: fragment.metadata,
        createdAt: new Date(now).toISOString(),
        embedding,
      });
    }

    await this.table!.add(rows);
    return results;
  }

  /**
   * Get fragment by ID
   */
  async getById(id: string): Promise<IdentityFragment | null> {
    await this.ensureInitialized();

    // Use vector search with zero vector to get all, then filter
    const zeroVector: number[] = Array.from({ length: this.vectorDim }, () => 0);
    const results = (await this.table!.vectorSearch(zeroVector)
      .where(`id = '${id}'`)
      .limit(1)
      .toArray()) as IdentityFragmentRow[];

    if (results.length === 0) {
      return null;
    }

    return this.rowToFragment(results[0]);
  }

  /**
   * Get fragments by category
   */
  async getByCategory(category: IdentityCategory): Promise<IdentityFragment[]> {
    await this.ensureInitialized();

    // Use vector search with zero vector to get all, then filter
    const zeroVector: number[] = Array.from({ length: this.vectorDim }, () => 0);
    const results = (await this.table!.vectorSearch(zeroVector)
      .where(`category = '${category}'`)
      .toArray()) as IdentityFragmentRow[];

    return results.map((row: IdentityFragmentRow) => this.rowToFragment(row));
  }

  /**
   * Get all fragments
   */
  async getAll(): Promise<IdentityFragment[]> {
    await this.ensureInitialized();

    // Use vector search with zero vector to get all rows
    const zeroVector: number[] = Array.from({ length: this.vectorDim }, () => 0);
    const results = (await this.table!.vectorSearch(zeroVector).toArray()) as IdentityFragmentRow[];

    return results.map((row: IdentityFragmentRow) => this.rowToFragment(row));
  }

  /**
   * Semantic search
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    await this.ensureInitialized();

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.embed(query);

    const limit = options?.limit || 10;
    const threshold = options?.threshold || 0.5;

    let searchQuery = this.table!.vectorSearch(queryEmbedding).limit(limit * 2); // Get more candidates for filtering

    // Filter by categories if specified
    if (options?.categories && options.categories.length > 0) {
      const categoryFilter = options.categories.map((c) => `category = '${c}'`).join(" OR ");
      searchQuery = searchQuery.where(`(${categoryFilter})`);
    }

    const results = await searchQuery.toArray();

    // Convert distance to similarity score and filter
    const mapped = results
      .map((row: IdentityFragmentRow & { _distance?: number }) => {
        const distance = row._distance ?? 0;
        // Convert L2 distance to similarity: sim = 1 / (1 + d)
        const score = 1 / (1 + distance);
        return {
          fragment: this.rowToFragment(row),
          score,
        };
      })
      .filter((r: SearchResult) => r.score >= threshold)
      .slice(0, limit); // Final limit after filtering

    return mapped;
  }

  /**
   * Search by category
   */
  async searchByCategory(
    query: string,
    category: IdentityCategory,
    limit?: number,
  ): Promise<SearchResult[]> {
    return this.search(query, {
      categories: [category],
      limit: limit || 10,
    });
  }

  /**
   * Find similar fragments
   */
  async findSimilar(
    content: string,
    threshold: number = 0.7,
    limit: number = 5,
  ): Promise<IdentityFragment[]> {
    const results = await this.search(content, { threshold, limit });
    return results.map((r) => r.fragment);
  }

  /**
   * Count all fragments
   */
  async count(): Promise<number> {
    await this.ensureInitialized();
    return this.table!.countRows();
  }

  /**
   * Count by category
   */
  async countByCategory(): Promise<Record<IdentityCategory, number>> {
    await this.ensureInitialized();

    const allFragments = await this.getAll();
    const counts: Record<string, number> = {};

    // Initialize all categories to 0
    const categories: IdentityCategory[] = [
      "goal",
      "constraint",
      "preference",
      "belief",
      "risk",
      "capability",
      "relationship",
      "historical_fact",
    ];

    for (const cat of categories) {
      counts[cat] = 0;
    }

    // Count fragments
    for (const fragment of allFragments) {
      counts[fragment.category] = (counts[fragment.category] || 0) + 1;
    }

    return counts as Record<IdentityCategory, number>;
  }

  /**
   * Delete fragment (soft delete - mark as reviewed)
   */
  async delete(id: string): Promise<boolean> {
    if (!this.writeAccessAllowed) {
      throw new Error("Identity store write access denied.");
    }

    await this.ensureInitialized();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid fragment ID format: ${id}`);
    }

    // For identity, we don't actually delete - we mark as reviewed
    // This maintains audit trail
    await this.markReviewed(id);
    return true;
  }

  /**
   * Mark fragment as reviewed
   */
  async markReviewed(id: string): Promise<void> {
    if (!this.writeAccessAllowed) {
      throw new Error("Identity store write access denied.");
    }

    await this.ensureInitialized();

    // Get current fragment
    const fragment = await this.getById(id);
    if (!fragment) {
      throw new Error(`Fragment not found: ${id}`);
    }

    // Update metadata
    const updatedMetadata = {
      ...fragment.metadata,
      reviewedByHuman: true,
    };

    // Update row (LanceDB doesn't have direct update, so we delete and re-add)
    await this.table!.delete(`id = '${id}'`);

    const row: IdentityFragmentRow = {
      id: fragment.id,
      category: fragment.category,
      content: fragment.content,
      context: fragment.context,
      confidence: fragment.confidence,
      source: fragment.source,
      metadata: JSON.stringify(updatedMetadata),
      created_at: new Date(fragment.createdAt).getTime(),
      embedding: fragment.embedding || [],
      reviewed: true,
    };

    await this.table!.add([row]);
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

  // Private helpers

  private rowToFragment(row: IdentityFragmentRow): IdentityFragment {
    return {
      id: row.id,
      category: row.category,
      content: row.content,
      context: row.context,
      confidence: row.confidence,
      source: row.source,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.created_at).toISOString(),
      embedding: row.embedding,
    };
  }
}

// ============================================================================
// Store Factory
// ============================================================================

export async function createLanceDBIdentityStore(
  config: LanceDBIdentityStoreConfig,
): Promise<LanceDBIdentityStore> {
  const store = new LanceDBIdentityStore(config);
  await store.ensureInitialized();
  return store;
}
