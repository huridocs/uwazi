type Callback<Item> = (item: Item, index: number, array: Item[]) => Promise<void>;

type RunInBatchesInput<Item> = {
  array: Item[];
  batchSize?: number;
};

type RunInBatchesCallback<Item> = (
  item: Item,
  index: number,
  batch: Item[],
  batches: Item[][]
) => Promise<void>;

export class ArrayUtils {
  /**
   * Executes promises in sequence.
   */
  static async sequentialFor<Item>(array: Item[], callback: Callback<Item>): Promise<void> {
    await array.reduce(async (promise, item, index) => {
      await promise;

      return callback(item, index, array);
    }, Promise.resolve());
  }

  /**
   * Executes promises in parallel.
   */
  static async parallelFor<Item>(array: Item[], callback: Callback<Item>): Promise<void> {
    await Promise.all(array.map(async (item, index) => callback(item, index, array)));
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
  static async runInBatches<Item>(
    { array, batchSize }: RunInBatchesInput<Item>,
    callback: RunInBatchesCallback<Item>
  ): Promise<void> {
    const _batchSize = batchSize || 10;

    const batches = this.splitInChunks(array, _batchSize);

    await ArrayUtils.sequentialFor(batches, async batch =>
      ArrayUtils.parallelFor(batch, async (...args) => callback(...args, batches))
    );
  }
}
