import { ArrayUtils } from '../Array';

describe('ArrayUtils', () => {
  describe('runInBatches', () => {
    it('should create batches correctly', async () => {
      await ArrayUtils.runInBatches(
        { array: [1, 2, 3, 4], batchSize: 2 },
        async (_, __, ___, batches) => {
          expect(batches).toEqual([
            [1, 2],
            [3, 4],
          ]);
        }
      );

      await ArrayUtils.runInBatches(
        { array: [1, 2, 3, 4, 5], batchSize: 2 },
        async (_, __, ___, batches) => {
          expect(batches).toEqual([[1, 2], [3, 4], [5]]);
        }
      );

      await ArrayUtils.runInBatches({ array: [1], batchSize: 2 }, async (_, __, ___, batches) => {
        expect(batches).toEqual([[1]]);
      });

      await ArrayUtils.runInBatches(
        { array: [1, 2, 3], batchSize: 1 },
        async (_, __, ___, batches) => {
          expect(batches).toEqual([[1], [2], [3]]);
        }
      );
    });

    it('should execute all items', async () => {
      const callback = jest.fn();

      await ArrayUtils.runInBatches({ array: [1, 2, 3, 4], batchSize: 2 }, callback);

      const calledItems = callback.mock.calls.map(([item]) => item);

      expect(callback).toHaveBeenCalledTimes(4);
      expect(calledItems).toEqual([1, 2, 3, 4]);
    });
  });
});
