/**
 * Sowwy Identity Model - Store Interface Foundation
 *
 * LanceDB-backed identity storage with semantic search.
 * Read-only access for most modules; extraction pipeline is sole writer.
 */

import {
  IdentityFragment,
  SearchOptions,
  SearchResult,
  type IdentityCategory,
} from "./fragments.js";
export type { IdentityCategory };

// ============================================================================
// Identity Store Interface
// ============================================================================

export interface IdentityStore {
  // Write operations (extraction pipeline only)
  /**
   * Write a single identity fragment to the store.
   * @param fragment - Identity data without id/createdAt
   * @returns The written fragment with generated id and timestamp
   */
  write(fragment: Omit<IdentityFragment, "id" | "createdAt">): Promise<IdentityFragment>;

  /**
   * Write multiple identity fragments in a batch.
   * More efficient than individual writes.
   * @param fragments - Array of identity data
   * @returns Array of written fragments with generated ids
   */
  writeBatch(
    fragments: Array<Omit<IdentityFragment, "id" | "createdAt">>,
  ): Promise<IdentityFragment[]>;

  // Read operations (all modules)
  /**
   * Retrieve a fragment by its unique ID.
   * @param id - The fragment identifier
   * @returns Fragment or null if not found
   */
  getById(id: string): Promise<IdentityFragment | null>;

  /**
   * Get all fragments of a specific category.
   * @param category - Identity category filter
   * @returns Array of matching fragments
   */
  getByCategory(category: IdentityCategory): Promise<IdentityFragment[]>;

  /**
   * Retrieve all identity fragments.
   * @returns Complete list of all fragments
   */
  getAll(): Promise<IdentityFragment[]>;

  // Semantic search
  /**
   * Search identities by semantic similarity.
   * @param query - Search query text
   * @param options - Search options (limit, threshold)
   * @returns Ranked search results with scores
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Search within a specific category.
   * @param query - Search query text
   * @param category - Category to filter by
   * @param limit - Maximum results (default 10)
   * @returns Category-filtered search results
   */
  searchByCategory(
    query: string,
    category: IdentityCategory,
    limit?: number,
  ): Promise<SearchResult[]>;

  // Similarity
  findSimilar(content: string, threshold?: number, limit?: number): Promise<IdentityFragment[]>;

  // Statistics
  count(): Promise<number>;
  countByCategory(): Promise<Record<IdentityCategory, number>>;

  // Management
  delete(id: string): Promise<boolean>;
  markReviewed(id: string): Promise<void>;
}

// ============================================================================
// Identity Retrieval Options
// ============================================================================

export interface IdentityRetrievalOptions {
  maxFragments?: number;
  includeCategories?: IdentityCategory[];
  excludeCategories?: IdentityCategory[];
  minConfidence?: number;
}

// ============================================================================
// Identity Context (for persona injection)
// ============================================================================

export interface IdentityContext {
  goals: string[];
  constraints: string[];
  preferences: string[];
  beliefs: string[];
  risks: string[];
  capabilities: string[];
  relationships: string[];
  historicalFacts: string[];
  summary: string;
}

// ============================================================================
// Identity Store Factory
// ============================================================================

export type IdentityStoreFactory = () => Promise<IdentityStore>;
