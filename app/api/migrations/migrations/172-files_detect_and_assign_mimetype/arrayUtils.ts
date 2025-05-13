type Callback<Item> = (item: Item, index: number, array: Item[]) => Promise<void>;

export class ArrayUtils {
  static async sequentialFor<Item>(array: Item[], callback: Callback<Item>): Promise<any> {
    await array.reduce(async (promise, item, index) => {
      await promise;

      return callback(item, index, array);
    }, Promise.resolve());
  }
}
