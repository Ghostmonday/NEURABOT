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
  write(fragment: Omit<IdentityFragment, "id" | "createdAt">): Promise<IdentityFragment>;
  writeBatch(
    fragments: Array<Omit<IdentityFragment, "id" | "createdAt">>,
  ): Promise<IdentityFragment[]>;

  // Read operations (all modules)
  getById(id: string): Promise<IdentityFragment | null>;
  getByCategory(category: IdentityCategory): Promise<IdentityFragment[]>;
  getAll(): Promise<IdentityFragment[]>;

  // Semantic search
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
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
