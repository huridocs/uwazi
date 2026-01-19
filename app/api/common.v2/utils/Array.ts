type Callback<Item, Result = void> = (item: Item, index: number, array: Item[]) => Promise<Result>;

type RunInBatchesInput<Item> = {
  array: Item[];
  batchSize?: number;
};

type RunInBatchesCallback<Item, Result> = (
  item: Item,
  index: number,
  batch: Item[],
  batches: Item[][]
) => Promise<Result>;

export class ArrayUtils {
  /**
   * Executes promises in sequence.
   */
  static async sequentialFor<Item, Result>(
    array: Item[],
    callback: Callback<Item, Result>
  ): Promise<Result[]> {
    const results: Result[] = [];

    await array.reduce(async (promise, item, index) => {
      await promise;

      const result = await callback(item, index, array);
      results.push(result);

      return Promise.resolve();
    }, Promise.resolve());

    return results;
  }

  /**
   * Executes promises in parallel.
   */
  static async parallelFor<Item, Result>(
    array: Item[],
    callback: Callback<Item, Result>
  ): Promise<Result[]> {
    return Promise.all(array.map(async (item, index) => callback(item, index, array)));
  }

  static splitInChunks<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  /**
   * Executes promises in parallel but in batches.
   * Each batch runs in parallel, but batches execute one after another.
   *
   * @batchSize = 10
   */
  static async runInBatches<Item, Result>(
    { array, batchSize }: RunInBatchesInput<Item>,
    callback: RunInBatchesCallback<Item, Result>
  ): Promise<Result[]> {
    const _batchSize = batchSize || 10;

    const batches = this.splitInChunks(array, _batchSize);

    const results = await ArrayUtils.sequentialFor(batches, async batch =>
      ArrayUtils.parallelFor(batch, async (...args) => callback(...args, batches))
    );

    return results.flat();
  }

  static splitInTwo<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const pass: T[] = [];
    const fail: T[] = [];

    array.forEach(item => {
      if (predicate(item)) {
        pass.push(item);
      } else {
        fail.push(item);
      }
    });

    return [pass, fail];
  }

  static deduplicate<T>(array: T[], checker: (item: T) => string | number | undefined | null): T[] {
    const seen = new Set();
    const result: T[] = [];

    array.forEach(item => {
      const key = checker(item);

      if (Boolean(key) && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    });

    return result;
  }
}
