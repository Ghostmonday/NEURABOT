/**
 * Stub Identity Store for Testing
 *
 * In-memory implementation for unit tests.
 */

import type {
  IdentityCategory,
  IdentityFragment,
  SearchOptions,
  SearchResult,
} from "./fragments.js";
import type { IdentityStore } from "./store.js";

export function createStubIdentityStore(): IdentityStore {
  const fragments: IdentityFragment[] = [];

  return {
    async write(fragment: Omit<IdentityFragment, "id" | "createdAt">): Promise<IdentityFragment> {
      const id = `stub-${Date.now()}-${Math.random()}`;
      const fullFragment: IdentityFragment = {
        ...fragment,
        id,
        createdAt: new Date().toISOString(),
      };
      fragments.push(fullFragment);
      return fullFragment;
    },

    async writeBatch(
      fragmentsToWrite: Array<Omit<IdentityFragment, "id" | "createdAt">>,
    ): Promise<IdentityFragment[]> {
      return Promise.all(fragmentsToWrite.map((f) => this.write(f)));
    },

    async getById(id: string): Promise<IdentityFragment | null> {
      return fragments.find((f) => f.id === id) || null;
    },

    async getByCategory(category: IdentityCategory): Promise<IdentityFragment[]> {
      return fragments.filter((f) => f.category === category);
    },

    async getAll(): Promise<IdentityFragment[]> {
      return [...fragments];
    },

    async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
      const limit = options?.limit || 10;
      const filtered = options?.categories
        ? fragments.filter((f) => options.categories!.includes(f.category))
        : fragments;

      return filtered.slice(0, limit).map((fragment) => ({
        fragment,
        score: 0.8, // Stub score
      }));
    },

    async searchByCategory(
      query: string,
      category: IdentityCategory,
      limit?: number,
    ): Promise<SearchResult[]> {
      return this.search(query, { categories: [category], limit });
    },

    async findSimilar(
      content: string,
      threshold: number = 0.7,
      limit: number = 5,
    ): Promise<IdentityFragment[]> {
      const results = await this.search(content, { limit, threshold });
      return results.map((r) => r.fragment);
    },

    async count(): Promise<number> {
      return fragments.length;
    },

    async countByCategory(): Promise<Record<IdentityCategory, number>> {
      const counts: Record<string, number> = {};
      for (const fragment of fragments) {
        counts[fragment.category] = (counts[fragment.category] || 0) + 1;
      }
      return counts as Record<IdentityCategory, number>;
    },

    async delete(id: string): Promise<boolean> {
      const index = fragments.findIndex((f) => f.id === id);
      if (index >= 0) {
        fragments.splice(index, 1);
        return true;
      }
      return false;
    },

    async markReviewed(id: string): Promise<void> {
      const fragment = fragments.find((f) => f.id === id);
      if (fragment) {
        fragment.metadata = { ...fragment.metadata, reviewedByHuman: true };
      }
    },
  };
}
