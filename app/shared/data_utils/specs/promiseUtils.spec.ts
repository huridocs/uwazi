import { syncedPromiseLoop } from '../promiseUtils';

describe('promiseUtils', () => {
  describe('syncedPromiseLoop', () => {
    it('should execute the promises synced', async () => {
      const waitTimes = [1000, 100, 10, 1];
      const marks: number[] = [];

      // eslint-disable-next-line no-promise-executor-return
      const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      await syncedPromiseLoop(waitTimes, async (waitNumber: number, index: number) => {
        await sleep(waitNumber);
        marks.push(index);
      });

      expect(marks).toEqual([0, 1, 2, 3]);
    });

    it('should stop execution if a promise resolves to false', async () => {
      const waitTimes = [1000, 100, 10, 1];
      const marks: number[] = [];

      // eslint-disable-next-line no-promise-executor-return
      const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      await syncedPromiseLoop(waitTimes, async (waitNumber: number, index: number) => {
        await sleep(waitNumber);
        marks.push(index);
        if (index === 2) return false;
        return true;
      });

      expect(marks).toEqual([0, 1, 2]);
    });
  });
});
