import { sleep } from '#shared/tsUtils.js';
import { sequentialPromises } from '../asyncUtils.js';

describe('asyncUtils', () => {
  describe('sequentialPromises()', () => {
    it('should execute promises sequentially', async () => {
      const delays = [1000, 100, 10, 1];
      const marks: number[] = [];
      await sequentialPromises(delays, async (delay: number, index: number) => {
        await sleep(delay);
        marks.push(index);
      });
      expect(marks).toEqual([0, 1, 2, 3]);
    });
  });
});
