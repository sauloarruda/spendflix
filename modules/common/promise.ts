// Concurrency limit for batch processing
// const LIMITED_CONCURRENCY = 5;

/**
 * Runs an array of promises in batches, respecting the concurrency limit.
 * Results are returned in the same order as input.
 * @param promises Array of promises
 */
async function all<T>(promises: Promise<T>[]): Promise<T[]> {
  const results: T[] = [];
  // let i = 0;
  // async function processNextBatch(): Promise<void> {
  //   if (i >= promises.length) return;
  //   const batch = promises.slice(i, i + LIMITED_CONCURRENCY);
  //   const batchResults = await Promise.all(batch);
  //   results.push(...batchResults);
  //   i += LIMITED_CONCURRENCY;
  //   await processNextBatch();
  // }
  // await processNextBatch();
  // return results;
  // eslint-disable-next-line no-restricted-syntax
  for (const promise of promises) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await promise);
  }
  return results;
}

const LimitedConcurrentPromise = { all };
export default LimitedConcurrentPromise;
