import { indexingConcurrency } from '../indexingConcurrency.js';

const MIBIBYTE = 1024 ** 2;

describe('indexingConcurrency', () => {
  it('throttles the memory-bound 2-core/1GiB queue worker to two in-flight batches', () => {
    expect(indexingConcurrency({ cpuCount: 2, memoryBytes: 1024 * MIBIBYTE })).toBe(2);
  });

  it('keeps the historical concurrency on a dev machine', () => {
    expect(indexingConcurrency({ cpuCount: 16, memoryBytes: 4096 * MIBIBYTE })).toBe(10);
  });

  it('caps concurrency by the available CPUs', () => {
    expect(indexingConcurrency({ cpuCount: 2, memoryBytes: 32 * 1024 * MIBIBYTE })).toBe(2);
  });

  it('never exceeds the hard maximum', () => {
    expect(indexingConcurrency({ cpuCount: 64, memoryBytes: 128 * 1024 * MIBIBYTE })).toBe(10);
  });

  it('never returns less than one', () => {
    expect(indexingConcurrency({ cpuCount: 1, memoryBytes: 512 * MIBIBYTE })).toBe(1);
  });
});
