/**
 * Embedding Adapter: Wraps memory system's EmbeddingProvider to match identity store's interface
 *
 * The memory system uses `embedQuery()` / `embedBatch()`, while the identity store
 * expects `embed()` / `getDimensions()`. This adapter bridges the gap.
 */

import type { EmbeddingProvider as MemoryEmbeddingProvider } from "../../memory/embeddings.js";
import type { EmbeddingProvider } from "./lancedb-store.js";

/**
 * Adapts memory system's EmbeddingProvider to identity store's EmbeddingProvider interface
 */
export function adaptMemoryEmbeddingProvider(
  memoryProvider: MemoryEmbeddingProvider,
  dimensions: number,
): EmbeddingProvider {
  return {
    embed: async (text: string): Promise<number[]> => {
      return await memoryProvider.embedQuery(text);
    },
    getDimensions: (): number => {
      return dimensions;
    },
  };
}
