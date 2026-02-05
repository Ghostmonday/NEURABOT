/**
 * LRU Cache Implementation
 *
 * Least Recently Used cache with size limits.
 * Used for session tracking, query result caching, and other bounded caches.
 */

/**
 * LRU Cache
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();

  constructor(private maxSize: number) {
    if (maxSize < 1) {
      throw new Error("LRU cache maxSize must be at least 1");
    }
  }

  /**
   * Get value by key (moves to end - most recently used)
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Set value by key
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing - move to end
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Get all values
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Get all entries
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}
