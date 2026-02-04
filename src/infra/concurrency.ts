/**
 * Concurrency Utilities
 *
 * Provides consistent concurrency control across the codebase.
 * Consolidates multiple implementations into a single, reusable utility.
 */

/**
 * Run async operations with concurrency limit
 *
 * @param items - Items to process
 * @param concurrency - Maximum concurrent operations
 * @param fn - Async function to run for each item
 * @returns Array of results in same order as input
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  const executing: Array<Promise<void>> = [];
  let index = 0;

  const executeNext = async (): Promise<void> => {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];

      const promise = fn(item, currentIndex)
        .then((result) => {
          results[currentIndex] = result;
        })
        .catch((error) => {
          // Store error as result
          results[currentIndex] = error as unknown as R;
        });

      executing.push(promise);

      // Wait for one to complete if we've hit concurrency limit
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        // Remove completed promises
        executing.splice(
          executing.findIndex((p) => {
            // Check if promise is resolved
            let resolved = false;
            p.then(() => {
              resolved = true;
            });
            return resolved;
          }),
          1,
        );
      }
    }
  };

  // Start execution
  await executeNext();

  // Wait for all remaining operations
  await Promise.all(executing);

  return results;
}

/**
 * Create a concurrency-limited queue
 */
export class ConcurrencyQueue<T, R> {
  private queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: unknown) => void;
  }> = [];
  private executing = 0;

  constructor(
    private concurrency: number,
    private processor: (item: T) => Promise<R>,
  ) {}

  /**
   * Add item to queue
   */
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.executing >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.executing++;
    const { item, resolve, reject } = this.queue.shift()!;

    try {
      const result = await this.processor(item);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.executing--;
      this.process(); // Process next item
    }
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Get number of executing operations
   */
  get executingCount(): number {
    return this.executing;
  }
}
