/**
 * Migration: Re-embed identity fragments when embedding provider changes
 *
 * Detects zero-vector fragments (from stub embedder) and re-embeds them
 * with the current embedding provider.
 */

import type { EmbeddingProvider } from "./lancedb-store.js";
import type { IdentityStore } from "./store.js";

/**
 * Check if a vector is a zero vector (all zeros)
 */
function isZeroVector(vector: number[]): boolean {
  return vector.every((v) => v === 0);
}

/**
 * Migrate identity fragments: re-embed zero-vector fragments with new provider
 *
 * @param identityStore - The identity store (must have write access)
 * @param embeddingProvider - The new embedding provider to use
 * @returns Number of fragments migrated
 */
export async function migrateZeroVectorFragments(
  identityStore: IdentityStore & { writeAccessAllowed: boolean },
  embeddingProvider: EmbeddingProvider,
): Promise<number> {
  if (!identityStore.writeAccessAllowed) {
    console.warn(
      "[Identity Migration] Write access denied. Migration skipped. Only extraction pipeline can migrate.",
    );
    return 0;
  }

  const allFragments = await identityStore.getAll();
  const zeroVectorFragments = allFragments.filter((f) => f.embedding && isZeroVector(f.embedding));

  if (zeroVectorFragments.length === 0) {
    console.log("[Identity Migration] No zero-vector fragments found. Migration not needed.");
    return 0;
  }

  console.log(
    `[Identity Migration] Found ${zeroVectorFragments.length} zero-vector fragments. Re-embedding...`,
  );

  let migrated = 0;
  for (const fragment of zeroVectorFragments) {
    try {
      // Generate new embedding
      const newEmbedding = await embeddingProvider.embed(
        `${fragment.category}: ${fragment.content}`,
      );

      // Delete old fragment and write new one with updated embedding
      await identityStore.delete(fragment.id);
      await identityStore.write({
        category: fragment.category,
        content: fragment.content,
        context: fragment.context,
        confidence: fragment.confidence,
        source: fragment.source,
        metadata: {
          ...fragment.metadata,
          migratedFromZeroVector: true,
          migratedAt: new Date().toISOString(),
        },
      });

      migrated++;
    } catch (error) {
      console.error(
        `[Identity Migration] Failed to migrate fragment ${fragment.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(`[Identity Migration] Migrated ${migrated}/${zeroVectorFragments.length} fragments.`);
  return migrated;
}
