/**
 * Sowwy Memory - Consolidation Service
 * 
 * Consolidates daily memory logs into long-term memory.
 * Merges similar fragments, removes outdated information, and prioritizes
 * high-confidence entries.
 * 
 * ⚠️ CONSOLIDATION RULES:
 * - Merge similar fragments
 * - Remove outdated information
 * - Prioritize by frequency of confirmation
 * - Keep only actionable insights
 */

import type {
  IdentityCategory,
  PostgresMemoryStore,
  PreferenceEntry,
  MemoryEntry,
} from "./pg-store.js";
import type { LanceDBMemoryStore } from "./lancedb-store.js";

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
}

// ============================================================================
// Consolidation Service
// ============================================================================

export class MemoryConsolidationService {
  constructor(
    private pgStore: PostgresMemoryStore,
    private lanceStore: LanceDBMemoryStore,
  ) {}

  /**
   * Consolidate preferences by merging similar ones
   */
  async consolidatePreferences(
    category: IdentityCategory,
    options: ConsolidationOptions = {},
  ): Promise<void> {
    const minConfidence = options.minConfidence ?? 0.7;
    const minFrequency = options.minFrequency ?? 2;

    const preferences = await this.pgStore.getPreferences(category, 1000);

    // Group by similarity
    const groups = this.groupSimilarPreferences(preferences);

    for (const group of groups) {
      if (group.length < minFrequency) continue;

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
      }
    }
  }

  /**
   * Consolidate memory entries
   */
  async consolidateMemories(
    category: IdentityCategory,
    options: ConsolidationOptions = {},
  ): Promise<void> {
    const minConfidence = options.minConfidence ?? 0.7;
    const maxAgeDays = options.maxAgeDays ?? 90;

    const memories = await this.pgStore.getMemoryByCategory(category, 1000);

    // Filter by confidence and age
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);

    const validMemories = memories.filter(
      (m) =>
        m.confidence >= minConfidence &&
        m.created_at >= cutoffDate &&
        !m.verified, // Don't consolidate verified entries
    );

    // Group similar memories
    const groups = this.groupSimilarMemories(validMemories);

    for (const group of groups) {
      if (group.length < 2) continue;

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
    }
  }

  /**
   * Group similar preferences together
   */
  private groupSimilarPreferences(
    preferences: PreferenceEntry[],
  ): PreferenceEntry[][] {
    const groups: PreferenceEntry[][] = [];
    const used = new Set<string>();

    for (const pref of preferences) {
      if (used.has(pref.id)) continue;

      const group = [pref];
      used.add(pref.id);

      // Find similar preferences
      for (const other of preferences) {
        if (used.has(other.id)) continue;
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
   * Check if two preferences are similar
   */
  private areSimilarPreferences(
    a: PreferenceEntry,
    b: PreferenceEntry,
  ): boolean {
    // Same category required
    if (a.category !== b.category) return false;

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
    const mostFrequent = Array.from(textCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    // Average strength
    const avgStrength =
      group.reduce((sum, p) => sum + p.strength, 0) / group.length;

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
   * Group similar memories together
   */
  private groupSimilarMemories(memories: MemoryEntry[]): MemoryEntry[][] {
    const groups: MemoryEntry[][] = [];
    const used = new Set<string>();

    for (const memory of memories) {
      if (used.has(memory.id)) continue;

      const group = [memory];
      used.add(memory.id);

      // Find similar memories (simple text similarity)
      for (const other of memories) {
        if (used.has(other.id)) continue;
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
   * Check if two memories are similar
   */
  private areSimilarMemories(a: MemoryEntry, b: MemoryEntry): boolean {
    if (a.category !== b.category) return false;

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
    const longest = group.reduce((a, b) =>
      a.content.length > b.content.length ? a : b,
    );

    // Average confidence
    const avgConfidence =
      group.reduce((sum, m) => sum + m.confidence, 0) / group.length;

    return {
      category: group[0].category,
      content: longest.content,
      confidence: avgConfidence,
    };
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

    for (const category of categories) {
      await this.consolidatePreferences(category, options);
      await this.consolidateMemories(category, options);
    }
  }
}
