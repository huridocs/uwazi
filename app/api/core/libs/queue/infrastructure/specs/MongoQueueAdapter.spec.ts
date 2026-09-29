import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import {
  DefaultTestingQueueAdapter,
  TestingRoundRobinQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { JobDBO } from '../MongoQueueAdapter.js';
import {
  describeQueueAdapterContract,
  mockNow,
  QueueAdapterHarness,
  StoredJob,
  storedJob,
} from './QueueAdapterContract.js';

const collection = () => testingDB.mongodb!.collection<JobDBO>('jobs');

const insert = async (jobs: StoredJob[]) => {
  if (jobs.length) {
    await collection().insertMany(
      jobs.map(({ id, ...job }) => ({ _id: new ObjectId(id), ...job }))
    );
  }
};

const stored = async (): Promise<StoredJob[]> =>
  (await collection().find().toArray()).map(({ _id, ...job }) => ({
    id: _id.toHexString(),
    ...job,
  }));

const mongoHarness = async (): Promise<QueueAdapterHarness> => {
  await testingEnvironment.setUp({ jobs: [] });
  return {
    adapter: () => DefaultTestingQueueAdapter(),
    roundRobinAdapter: () => TestingRoundRobinQueueAdapter(),
    insert,
    stored,
  };
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describeQueueAdapterContract('MongoQueueAdapter', mongoHarness);

describe('MongoQueueAdapter', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({ jobs: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const failedNames = async () =>
    (await stored())
      .filter(job => job.failed)
      .map(job => job.name)
      .sort();

  it.each([
    { adapter: 'default', build: DefaultTestingQueueAdapter },
    { adapter: 'round robin', build: TestingRoundRobinQueueAdapter },
  ])(
    'should mark the jobs that reached maxRetries as failed when picking ($adapter)',
    async ({ build }) => {
      mockNow(10);
      await insert([
        storedJob({ name: 'exhausted 1', retryCount: 5 }),
        storedJob({ name: 'exhausted 2', retryCount: 3 }),
        storedJob({ name: 'retriable', retryCount: 1 }),
      ]);

      await build().pickJob('queue name');

      expect(await failedNames()).toEqual(['exhausted 1', 'exhausted 2']);
    }
  );

  it('should mark a job as failed only once its last attempt lock expires', async () => {
    const setNow = mockNow(1000);
    await insert([
      storedJob({
        name: 'last attempt',
        retryCount: 2,
        options: { lockWindow: 5000, maxRetries: 3 },
      }),
    ]);
    const adapter = DefaultTestingQueueAdapter();

    await adapter.pickJob('queue name');
    setNow(3000);
    await adapter.pickJob('queue name');
    expect(await failedNames()).toEqual([]);

    setNow(7000);
    await adapter.pickJob('queue name');
    expect(await failedNames()).toEqual(['last attempt']);
  });
});
