/**
 * Sowwy Memory - Consolidation Service
 *
 * Consolidates daily memory logs into long-term memory.
 * Merges similar fragments, removes outdated information, and prioritizes
 * high-confidence entries.
 *
 * Uses vector similarity search via LanceDB with word-overlap fallback.
 *
 * ⚠️ CONSOLIDATION RULES:
 * - Merge similar fragments
 * - Remove outdated information
 * - Prioritize by frequency of confirmation
 * - Keep only actionable insights
 */

import { createHash } from "node:crypto";
import type { AuditStore } from "../mission-control/store.js";
import type { LanceDBMemoryStore, EmbeddingProvider } from "./lancedb-store.js";
import type {
  IdentityCategory,
  PostgresMemoryStore,
  PreferenceEntry,
  MemoryEntry,
} from "./pg-store.js";
import { getChildLogger } from "../../logging/logger.js";

// ============================================================================
// Types
// ============================================================================

export interface ConsolidationOptions {
  /** Minimum confidence threshold (default: 0.7) */
  minConfidence?: number;
  /** Minimum frequency for merging (default: 2) */
  minFrequency?: number;
  /** Maximum age in days for outdated entries (default: 90) */
  maxAgeDays?: number;
  /** Vector search similarity threshold (default: 0.7) */
  minVectorSimilarity?: number;
  /** Limit vector search results (default: 20) */
  vectorSearchLimit?: number;
}

// ============================================================================
// Union-Find (Disjoint Set Union) for grouping similar items
// ============================================================================

class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(ids: string[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(id: string): string {
    const root = this.parent.get(id);
    if (!root) throw new Error(`Item not found: ${String(id)}`);
    if (root !== id) {
      const found = this.find(root);
      this.parent.set(id, found);
      return found;
    }
    return root;
  }

  union(idA: string, idB: string): void {
    const rootA = this.find(idA);
    const rootB = this.find(idB);
    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA) ?? 0;
    const rankB = this.rank.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }

  getGroups(): string[][] {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(id);
    }
    return Array.from(groups.values());
  }
}

// ============================================================================
// Consolidation Service
// ============================================================================

export class MemoryConsolidationService {
  private readonly log = getChildLogger({ subsystem: "memory-consolidation" });

  constructor(
    private pgStore: PostgresMemoryStore,
    private lanceStore: LanceDBMemoryStore,
    private embeddingProvider: EmbeddingProvider,
    private auditStore?: AuditStore,
  ) {}

  /**
   * Find similar items using vector search with word-overlap fallback
   */
  private async findSimilarViaVector<
    T extends { id: string; content?: string; preference?: string },
  >(
    items: T[],
    category: IdentityCategory,
    minScore: number = 0.7,
    searchLimit: number = 20,
  ): Promise<Map<string, string[]>> {
    const similarMap = new Map<string, string[]>();

    if (items.length === 0) {
      return similarMap;
    }

    // Check if lanceStore is available for vector search
    try {
      // Try to access lanceStore's search method
      for (const item of items) {
        const content = item.content ?? item.preference ?? "";
        if (!content) continue;

        try {
          const results = await this.lanceStore.search(content, {
            category,
            limit: searchLimit,
            minScore,
          });

          // Filter to items in our set and add to similar map
          const itemIds = new Set(items.map((i) => i.id));
          const similarIds = results
            .filter((r) => itemIds.has(r.memoryId) && r.memoryId !== item.id)
            .map((r) => r.memoryId);

          if (similarIds.length > 0) {
            similarMap.set(item.id, similarIds);
          }
        } catch {
          // Fall back to word-overlap for this item
          this.log.debug("Vector search failed for item, using fallback", {
            itemId: item.id,
            category,
          });
          const fallback = this.legacyWordOverlapMatch(content, items);
          if (fallback.length > 0) {
            similarMap.set(item.id, fallback);
          }
        }
      }
    } catch (err) {
      this.log.warn("Vector search unavailable, using word-overlap fallback", {
        err: err instanceof Error ? err.message : String(err),
        category,
      });
      // Fall back to word-overlap for all items
      for (const item of items) {
        const content = item.content ?? item.preference ?? "";
        const fallback = this.legacyWordOverlapMatch(content, items);
        if (fallback.length > 0) {
          similarMap.set(item.id, fallback);
        }
      }
    }

    return similarMap;
  }

  /**
   * Legacy word-overlap matching for fallback
   */
  private legacyWordOverlapMatch<T extends { id: string; content?: string; preference?: string }>(
    content: string,
    items: T[],
    threshold: number = 0.6,
  ): string[] {
    const aWords = content.toLowerCase().split(/\s+/);
    const similar: string[] = [];

    for (const item of items) {
      const itemContent = item.content ?? item.preference ?? "";
      const bWords = itemContent.toLowerCase().split(/\s+/);
      const commonWords = aWords.filter((w) => bWords.includes(w));
      const similarity = commonWords.length / Math.max(aWords.length, bWords.length);

      if (similarity >= threshold) {
        similar.push(item.id);
      }
    }

    return similar;
  }

  /**
   * Consolidate preferences by merging similar ones
   */
  async consolidatePreferences(
    category: IdentityCategory,
    options: ConsolidationOptions = {},
  ): Promise<{ before: number; after: number; merged: number; verified: boolean }> {
    const minConfidence = options.minConfidence ?? 0.7;
    const minFrequency = options.minFrequency ?? 2;
    const minVectorSimilarity = options.minVectorSimilarity ?? 0.7;
    const vectorSearchLimit = options.vectorSearchLimit ?? 20;

    const preferences = await this.pgStore.getPreferences(category, 1000);
    const beforeCount = preferences.length;
    const beforeChecksum = this.computeChecksum(preferences.map((p) => p.id).sort());

    // Group by similarity using vector search
    const groups = await this.groupSimilarPreferences(
      preferences,
      category,
      minVectorSimilarity,
      vectorSearchLimit,
    );
    let mergedCount = 0;

    for (const group of groups) {
      if (group.length < minFrequency) {
        continue;
      }

      // Merge group into single preference
      const merged = this.mergePreferences(group);

      if (Math.abs(merged.strength) >= minConfidence) {
        // Update or create merged preference
        await this.pgStore.upsertPreference({
          category: merged.category,
          preference: merged.preference,
          strength: merged.strength,
          evidence: merged.evidence,
        });
        mergedCount++;
      }
    }

    // Verify consolidation
    const afterPreferences = await this.pgStore.getPreferences(category, 1000);
    const afterCount = afterPreferences.length;
    const afterChecksum = this.computeChecksum(afterPreferences.map((p) => p.id).sort());
    const verified = afterCount <= beforeCount && afterChecksum !== beforeChecksum;

    if (afterCount > beforeCount) {
      this.log.warn("Preference count increased unexpectedly during consolidation", {
        beforeCount,
        afterCount,
        category,
        beforeChecksum,
        afterChecksum,
      });
    }

    // Log to audit store if available
    if (this.auditStore) {
      await this.auditStore
        .append({
          taskId: "system",
          action: "memory.consolidatePreferences",
          details: {
            category,
            beforeCount,
            afterCount,
            mergedCount,
            verified,
            beforeChecksum,
            afterChecksum,
          },
          performedBy: "system",
        })
        .catch((err) => {
          this.log.error("Failed to log consolidation to audit store", {
            error: err instanceof Error ? err.message : String(err),
            category,
            action: "memory.consolidatePreferences",
          });
        });
    }

    return { before: beforeCount, after: afterCount, merged: mergedCount, verified };
  }

  /**
   * Consolidate memory entries
   */
  async consolidateMemories(
    category: IdentityCategory,
    options: ConsolidationOptions = {},
  ): Promise<{ before: number; after: number; merged: number; verified: boolean }> {
    const minConfidence = options.minConfidence ?? 0.7;
    const maxAgeDays = options.maxAgeDays ?? 90;
    const minVectorSimilarity = options.minVectorSimilarity ?? 0.7;
    const vectorSearchLimit = options.vectorSearchLimit ?? 20;

    const memories = await this.pgStore.getMemoryByCategory(category, 1000);
    const beforeCount = memories.length;
    const beforeChecksum = this.computeChecksum(memories.map((m) => `${m.id}:${m.content}`).sort());

    // Filter by confidence and age
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);

    const validMemories = memories.filter(
      (m) => m.confidence >= minConfidence && m.created_at >= cutoffDate && !m.verified, // Don't consolidate verified entries
    );

    // Group similar memories using vector search
    const groups = await this.groupSimilarMemories(
      validMemories,
      category,
      minVectorSimilarity,
      vectorSearchLimit,
    );
    let mergedCount = 0;
    const expectedReduction = groups.filter((g) => g.length >= 2).length;

    for (const group of groups) {
      if (group.length < 2) {
        continue;
      }

      // Merge group
      const merged = this.mergeMemories(group);

      // Update memory entry
      await this.pgStore.upsertMemoryEntry({
        category: merged.category,
        content: merged.content,
        confidence: merged.confidence,
        source: "consolidation",
        verified: false,
      });
      mergedCount++;
    }

    // Verify consolidation
    const afterMemories = await this.pgStore.getMemoryByCategory(category, 1000);
    const afterCount = afterMemories.length;
    const afterChecksum = this.computeChecksum(
      afterMemories.map((m) => `${m.id}:${m.content}`).sort(),
    );
    const verified =
      afterCount <= beforeCount &&
      afterChecksum !== beforeChecksum &&
      afterCount <= beforeCount - expectedReduction + mergedCount;

    if (afterCount > beforeCount - expectedReduction + mergedCount) {
      this.log.warn("Memory reduction less than expected", {
        beforeCount,
        afterCount,
        expectedReduction,
        mergedCount,
        category,
      });
    }

    // Log to audit store if available
    if (this.auditStore) {
      await this.auditStore
        .append({
          taskId: "system",
          action: "memory.consolidateMemories",
          details: {
            category,
            beforeCount,
            afterCount,
            mergedCount,
            expectedReduction,
            verified,
            beforeChecksum,
            afterChecksum,
          },
          performedBy: "system",
        })
        .catch((err) => {
          this.log.error("Failed to log consolidation to audit store", {
            error: err instanceof Error ? err.message : String(err),
            category,
            action: "memory.consolidateMemories",
          });
        });
    }

    return { before: beforeCount, after: afterCount, merged: mergedCount, verified };
  }

  /**
   * Group similar preferences using vector search with Union-Find
   */
  private async groupSimilarPreferences(
    preferences: PreferenceEntry[],
    category: IdentityCategory,
    minScore: number,
    searchLimit: number,
  ): Promise<PreferenceEntry[][]> {
    if (preferences.length === 0) {
      return [];
    }

    // Try vector similarity search
    const similarMap = await this.findSimilarViaVector(
      preferences,
      category,
      minScore,
      searchLimit,
    );

    if (similarMap.size === 0) {
      // Fall back to legacy method if vector search didn't find similarities
      return this.groupSimilarPreferencesLegacy(preferences);
    }

    // Use Union-Find to group items based on similarity relationships
    const uf = new UnionFind(preferences.map((p) => p.id));

    for (const [itemId, similarIds] of similarMap) {
      for (const similarId of similarIds) {
        uf.union(itemId, similarId);
      }
    }

    return uf.getGroups().map((ids) => preferences.filter((p) => ids.includes(p.id)));
  }

  /**
   * Legacy preference grouping (fallback)
   */
  private groupSimilarPreferencesLegacy(preferences: PreferenceEntry[]): PreferenceEntry[][] {
    const groups: PreferenceEntry[][] = [];
    const used = new Set<string>();

    for (const pref of preferences) {
      if (used.has(pref.id)) {
        continue;
      }

      const group: PreferenceEntry[] = [pref];
      used.add(pref.id);

      // Find similar preferences
      for (const other of preferences) {
        if (used.has(other.id)) {
          continue;
        }
        if (this.areSimilarPreferences(pref, other)) {
          group.push(other);
          used.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Group similar memories using vector search with Union-Find
   */
  private async groupSimilarMemories(
    memories: MemoryEntry[],
    category: IdentityCategory,
    minScore: number,
    searchLimit: number,
  ): Promise<MemoryEntry[][]> {
    if (memories.length === 0) {
      return [];
    }

    // Try vector similarity search
    const similarMap = await this.findSimilarViaVector(memories, category, minScore, searchLimit);

    if (similarMap.size === 0) {
      // Fall back to legacy method if vector search didn't find similarities
      return this.groupSimilarMemoriesLegacy(memories);
    }

    // Use Union-Find to group items based on similarity relationships
    const uf = new UnionFind(memories.map((m) => m.id));

    for (const [itemId, similarIds] of similarMap) {
      for (const similarId of similarIds) {
        uf.union(itemId, similarId);
      }
    }

    return uf.getGroups().map((ids) => memories.filter((m) => ids.includes(m.id)));
  }

  /**
   * Legacy memory grouping (fallback)
   */
  private groupSimilarMemoriesLegacy(memories: MemoryEntry[]): MemoryEntry[][] {
    const groups: MemoryEntry[][] = [];
    const used = new Set<string>();

    for (const memory of memories) {
      if (used.has(memory.id)) {
        continue;
      }

      const group = [memory];
      used.add(memory.id);

      // Find similar memories (simple text similarity)
      for (const other of memories) {
        if (used.has(other.id)) {
          continue;
        }
        if (this.areSimilarMemories(memory, other)) {
          group.push(other);
          used.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Check if two preferences are similar (legacy word-overlap)
   */
  private areSimilarPreferences(a: PreferenceEntry, b: PreferenceEntry): boolean {
    // Same category required
    if (a.category !== b.category) {
      return false;
    }

    // Check text similarity (simple approach)
    const aWords = a.preference.toLowerCase().split(/\s+/);
    const bWords = b.preference.toLowerCase().split(/\s+/);
    const commonWords = aWords.filter((w) => bWords.includes(w));
    const similarity = commonWords.length / Math.max(aWords.length, bWords.length);

    return similarity > 0.6; // 60% word overlap
  }

  /**
   * Merge preferences into single entry
   */
  private mergePreferences(group: PreferenceEntry[]): {
    category: IdentityCategory;
    preference: string;
    strength: number;
    evidence: Array<{ source: string; timestamp: Date }>;
  } {
    // Use most frequent preference text
    const textCounts = new Map<string, number>();
    for (const pref of group) {
      textCounts.set(pref.preference, (textCounts.get(pref.preference) ?? 0) + 1);
    }
    const mostFrequent = Array.from(textCounts.entries()).toSorted((a, b) => b[1] - a[1])[0][0];

    // Average strength
    const avgStrength = group.reduce((sum, p) => sum + p.strength, 0) / group.length;

    // Combine evidence
    const evidence: Array<{ source: string; timestamp: Date }> = [];
    for (const pref of group) {
      evidence.push(...pref.evidence);
    }

    return {
      category: group[0].category,
      preference: mostFrequent,
      strength: avgStrength,
      evidence,
    };
  }

  /**
   * Check if two memories are similar (legacy word-overlap)
   */
  private areSimilarMemories(a: MemoryEntry, b: MemoryEntry): boolean {
    if (a.category !== b.category) {
      return false;
    }

    // Simple text similarity
    const aWords = a.content.toLowerCase().split(/\s+/);
    const bWords = b.content.toLowerCase().split(/\s+/);
    const commonWords = aWords.filter((w) => bWords.includes(w));
    const similarity = commonWords.length / Math.max(aWords.length, bWords.length);

    return similarity > 0.7; // 70% word overlap
  }

  /**
   * Merge memories into single entry
   */
  private mergeMemories(group: MemoryEntry[]): {
    category: IdentityCategory;
    content: string;
    confidence: number;
  } {
    // Use longest content (most detailed)
    const longest = group.reduce((a, b) => (a.content.length > b.content.length ? a : b));

    // Average confidence
    const avgConfidence = group.reduce((sum, m) => sum + m.confidence, 0) / group.length;

    return {
      category: group[0].category,
      content: longest.content,
      confidence: avgConfidence,
    };
  }

  /**
   * Compute a simple checksum for verification
   */
  private computeChecksum(items: string[]): string {
    const hash = createHash("sha256");
    hash.update(items.join("|"));
    return hash.digest("hex").slice(0, 16);
  }

  /**
   * Run full consolidation for all categories
   */
  async consolidateAll(options: ConsolidationOptions = {}): Promise<void> {
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

    // Run categories in parallel for better throughput
    const results = await Promise.allSettled(
      categories.map(async (category) => {
        await this.consolidatePreferences(category, options);
        await this.consolidateMemories(category, options);
      }),
    );

    // Log any failures
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        this.log.error("Category consolidation failed", {
          category: categories[i],
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }
}
