import os from 'node:os';
import v8 from 'node:v8';

const MIBIBYTE = 1024 ** 2;
const MAX_INDEXING_CONCURRENCY = 10;

// Full-text indexing keeps several copies of a batch's documents in memory at once (the loaded
// entities, the transformed batch and the serialized bulk request). The historical default of 10
// concurrent batches fits comfortably in the ~4 GiB heap of a dev machine, so one batch is
// budgeted at ~400 MiB. The constrained 1 GiB queue worker therefore runs two batches at a time
// instead of ten.
const MEMORY_BUDGET_PER_BATCH_BYTES = 400 * MIBIBYTE;

type IndexingConcurrencyOptions = {
  cpuCount?: number;
  memoryBytes?: number;
};

const availableCpuCount = (): number =>
  typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;

const availableMemoryBytes = (): number =>
  Math.min(v8.getHeapStatistics().heap_size_limit, os.totalmem());

/**
 * How many indexing batches may be in flight at once.
 *
 * Full-text indexing is memory-bound, so the concurrency grows with the memory available to this
 * process, capped by the CPUs it can use and a hard ceiling.
 */
export const indexingConcurrency = ({
  cpuCount = availableCpuCount(),
  memoryBytes = availableMemoryBytes(),
}: IndexingConcurrencyOptions = {}): number => {
  const byMemory = Math.max(1, Math.floor(memoryBytes / MEMORY_BUDGET_PER_BATCH_BYTES));
  const byCpu = Math.max(1, Math.floor(cpuCount));
  return Math.max(1, Math.min(byMemory, byCpu, MAX_INDEXING_CONCURRENCY));
};
