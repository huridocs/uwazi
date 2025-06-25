type Callback<Item> = (item: Item, index: number, array: Item[]) => Promise<void>;

export class ArrayUtils {
  static async sequentialFor<Item>(array: Item[], callback: Callback<Item>): Promise<void> {
    await array.reduce(async (promise, item, index) => {
      await promise;

      return callback(item, index, array);
    }, Promise.resolve());
  }

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
}
