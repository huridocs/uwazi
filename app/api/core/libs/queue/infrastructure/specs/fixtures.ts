import { ObjectId } from 'mongodb';
import { Job } from '../QueueAdapter';
import { QueueAdapter } from '../QueueAdapter';
import { JobDBO } from '../MongoQueueAdapter';

type TestJobData = Partial<JobDBO> & { failed?: boolean; timestamp?: number };

export const createTestJob = (data: TestJobData): Job =>
  ({
    id: new ObjectId(),
    queue: data.queue || 'test-queue',
    name: data.name || 'test-job',
    params: data.params || {},
    namespace: data.namespace!,
    lockedUntil: data.lockedUntil || 0,
    createdAt: data.timestamp || data.createdAt || Date.now(),
    retryCount: data.retryCount || 0,
    failed: data.failed === true,
    options: data.options || {
      lockWindow: 1000 * 60 * 10, // 10 minutes
      maxRetries: 5,
    },
  }) as unknown as Job;

export const generateNamespaces = (tenantCounts: (string | number)[][]): string[] => {
  return tenantCounts.flatMap(([tenant, count]) => Array(count).fill(tenant) as string[]);
};

export const pushJobsForNamespaces = async (
  adapter: QueueAdapter,
  tenantCounts: (string | number)[][]
): Promise<void> => {
  const namespaces = generateNamespaces(tenantCounts);
  const baseTimestamp = Date.now();

  await Promise.all(
    namespaces.map(async (namespace, index) => {
      await adapter.pushJob(
        createTestJob({
          namespace,
          timestamp: baseTimestamp + index, // Ensure sequential timestamps
        })
      );
    })
  );
};

export const pickJobs = async (adapter: QueueAdapter): Promise<string[]> => {
  const pickedJobs: string[] = [];
  let pickedJob: Job | null = await adapter.pickJob('test-queue');

  while (pickedJob !== null) {
    pickedJobs.push(pickedJob.namespace);
    // eslint-disable-next-line no-await-in-loop
    pickedJob = await adapter.pickJob('test-queue');
  }

  return pickedJobs;
};
