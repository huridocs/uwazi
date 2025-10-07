import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { DefaultTestingQueueAdapter } from 'api/core/libs/queue/configuration/factories';
import { createTestJob } from './fixtures';

const OTHER_QUEUE_JOB = {
  _id: new ObjectId(),
  queue: 'other queue',
  message: 'a simple message',
  lockedUntil: 0,
};

beforeEach(async () => {
  await testingEnvironment.setUp({
    jobs: [OTHER_QUEUE_JOB],
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

it('should create a job in the given queue with the given message', async () => {
  const NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);
  const adapter = DefaultTestingQueueAdapter();

  const result = await adapter.pushJob({
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    namespace: 'namespace',
    options: {
      maxRetries: 3,
      lockWindow: 500,
    },
  });

  const messages = await testingDB.mongodb?.collection('jobs').find({}).toArray();
  expect(messages).toEqual([
    OTHER_QUEUE_JOB,
    {
      _id: new ObjectId(result),
      queue: 'queue name',
      name: 'a simple message',
      failed: false,
      params: {},
      lockedUntil: 0,
      createdAt: NOW_VALUE,
      namespace: 'namespace',
      retryCount: 0,
      options: {
        maxRetries: 3,
        lockWindow: 500,
      },
    },
  ]);
});

it('should return null if no jobs in the queue', async () => {
  const adapter = DefaultTestingQueueAdapter();

  const result = await adapter.pickJob('queue name');

  expect(result).toBe(null);
});

it('should only return non-locked jobs', async () => {
  const adapter = DefaultTestingQueueAdapter();
  let NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);
  const job = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    namespace: 'namespace',
    lockedUntil: 10,
    retryCount: 0,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  };
  await testingDB.mongodb?.collection('jobs').insertOne(job);

  let result = await adapter.pickJob('queue name');

  expect(result).toBe(null);
  expect(await testingDB.mongodb?.collection('jobs').find({}).toArray()).toEqual([
    OTHER_QUEUE_JOB,
    job,
  ]);

  NOW_VALUE = 11;
  result = await adapter.pickJob('queue name');

  expect(result).toEqual({
    id: job._id.toHexString(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    namespace: 'namespace',
    lockedUntil: 1000 + NOW_VALUE,
    retryCount: 1,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  });
  expect(await testingDB.mongodb?.collection('jobs').find({}).toArray()).toEqual([
    OTHER_QUEUE_JOB,
    {
      ...job,
      retryCount: 1,
      lockedUntil: NOW_VALUE + 1000,
    },
  ]);
});

it('should atomically get a job, lock it for 1000ms and increase retryCount by 1', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const NOW_VALUE = 11;
  jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);
  const job = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    namespace: 'namespace',
    lockedUntil: 10,
    retryCount: 0,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  };
  await testingDB.mongodb?.collection('jobs').insertOne(job);

  const result = await adapter.pickJob('queue name');

  expect(result).toEqual({
    id: job._id.toHexString(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    namespace: 'namespace',
    lockedUntil: 1000 + NOW_VALUE,
    retryCount: 1,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  });
});

const job1 = {
  _id: new ObjectId(),
  queue: 'queue name',
  message: 'a simple message',
  lockedUntil: 0,
  createdAt: 1,
  retryCount: 0,
  options: {
    lockWindow: 1000,
    maxRetries: 3,
  },
};
const job2 = {
  _id: new ObjectId(),
  queue: 'queue name',
  message: 'another simple message',
  lockedUntil: 0,
  createdAt: 2,
  retryCount: 0,
  options: {
    lockWindow: 1000,
    maxRetries: 3,
  },
};

it.each([
  { first: job1, second: job2 },
  { first: job2, second: job1 },
])('should get the oldest job possible', async ({ first, second }) => {
  const adapter = DefaultTestingQueueAdapter();
  const NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

  await testingDB.mongodb?.collection('jobs').insertMany([first, second]);

  const result1 = await adapter.pickJob('queue name');
  const result2 = await adapter.pickJob('queue name');
  expect(result1 && result1.id).toBe(job1._id.toHexString());
  expect(result2 && result2.id).toBe(job2._id.toHexString());
});

it('should increment the lock of a job the amount of miliseconds given by lockWindow', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);
  const job = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    lockedUntil: 0,
    createdAt: NOW_VALUE,
    namespace: 'namespace',
    retryCount: 0,
    options: {
      lockWindow: 2000,
      maxRetries: 5,
    },
  };
  await testingDB.mongodb?.collection('jobs').insertOne(job);

  await adapter.renewJobLock({ ...job, id: job._id.toHexString() });

  expect(await testingDB.mongodb?.collection('jobs').find({}).toArray()).toEqual([
    OTHER_QUEUE_JOB,
    {
      ...job,
      lockedUntil: NOW_VALUE + 2000,
    },
  ]);
});

it('should delete a job', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);
  const job = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'a simple message',
    params: {},
    lockedUntil: 0,
    createdAt: NOW_VALUE,
    namespace: 'namespace',
    retryCount: 0,
    options: {
      lockWindow: 2000,
      maxRetries: 5,
    },
  };
  await testingDB.mongodb?.collection('jobs').insertOne(job);

  await adapter.deleteJob({ ...job, id: job._id.toHexString() });

  expect(await testingDB.mongodb?.collection('jobs').find({}).toArray()).toEqual([OTHER_QUEUE_JOB]);
});

describe('Failed Jobs', () => {
  it('should move a job to failed jobs collection when marked as failed', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const NOW_VALUE = 1;
    jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

    const jobData = {
      namespace: 'namespace',
    };

    const job = createTestJob(jobData);
    await testingDB.mongodb!.collection('jobs').insertOne({
      _id: new ObjectId(job.id),
      ...jobData,
      lockedUntil: 0,
      retryCount: 0,
      failed: false,
    });

    await adapter.markJobAsFailed(job);

    const mainJobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();
    const failedJobs = await testingDB.mongodb!.collection('jobs_failed').find({}).toArray();

    expect(mainJobs).toEqual([OTHER_QUEUE_JOB]);
    expect(failedJobs[0]).toMatchObject({
      ...jobData,
      lockedUntil: 0,
      retryCount: 0,
      failed: true,
    });
  });

  it('should not pick failed jobs from the main collection', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const NOW_VALUE = 1;
    jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

    const jobData = {
      failed: true,
    };

    const job = createTestJob(jobData);
    await testingDB.mongodb?.collection('jobs').insertOne({
      _id: new ObjectId(job.id),
      ...jobData,
      lockedUntil: 0,
      retryCount: 0,
    });

    const result = await adapter.pickJob('queue name');
    expect(result).toBeNull();
  });

  it('should throw error when trying to mark non-existent job as failed', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const nonExistentJob = createTestJob({
      namespace: 'namespace',
    });

    await expect(adapter.markJobAsFailed(nonExistentJob)).rejects.toThrow(
      'Failed to mark job as failed'
    );
  });

  it('should handle multiple exceeded retry jobs efficiently in batch operations', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const NOW_VALUE = 1;
    jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

    // Create multiple jobs that have exceeded their maxRetries
    const exceededRetryJobs = [
      {
        _id: new ObjectId(),
        queue: 'queue name',
        name: 'exceeded retry job 1',
        params: {},
        namespace: 'namespace1',
        lockedUntil: 0,
        createdAt: NOW_VALUE,
        retryCount: 5, // Exceeds maxRetries of 3
        failed: false,
        options: {
          lockWindow: 1000,
          maxRetries: 3,
        },
      },
      {
        _id: new ObjectId(),
        queue: 'queue name',
        name: 'exceeded retry job 2',
        params: {},
        namespace: 'namespace2',
        lockedUntil: 0,
        createdAt: NOW_VALUE + 1,
        retryCount: 6, // Exceeds maxRetries of 3
        failed: false,
        options: {
          lockWindow: 1000,
          maxRetries: 3,
        },
      },
      {
        _id: new ObjectId(),
        queue: 'queue name',
        name: 'exceeded retry job 3',
        params: {},
        namespace: 'namespace3',
        lockedUntil: 0,
        createdAt: NOW_VALUE + 2,
        retryCount: 4, // Exceeds maxRetries of 3
        failed: false,
        options: {
          lockWindow: 1000,
          maxRetries: 3,
        },
      },
    ];

    await testingDB.mongodb?.collection('jobs').insertMany(exceededRetryJobs);

    // Pick a job - this should trigger the batch check for exceeded retry jobs
    await adapter.pickJob('queue name');

    const mainJobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();
    const failedJobs = await testingDB.mongodb?.collection('jobs_failed').find({}).toArray();

    // All exceeded retry jobs should be moved to failed jobs collection
    expect(mainJobs).toEqual([OTHER_QUEUE_JOB]);
    expect(failedJobs!).toHaveLength(3);

    // Verify all jobs are in failed collection with correct failed status
    const failedJobNames = failedJobs!.map(job => job.name).sort();
    expect(failedJobNames).toEqual([
      'exceeded retry job 1',
      'exceeded retry job 2',
      'exceeded retry job 3',
    ]);

    // Verify all jobs have failed: true
    failedJobs!.forEach(job => {
      expect(job.failed).toBe(true);
    });
  });
});

it('should not pick jobs that have exceeded maxRetries', async () => {
  const adapter = DefaultTestingQueueAdapter();
  const NOW_VALUE = 1;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);

  // Create a job that has exceeded maxRetries
  const exceededJob = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'exceeded job',
    params: {},
    namespace: 'namespace',
    lockedUntil: 0,
    retryCount: 3, // Already at maxRetries
    failed: false,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  };

  // Create a normal job that hasn't exceeded maxRetries
  const normalJob = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'normal job',
    params: {},
    namespace: 'namespace',
    lockedUntil: 0,
    retryCount: 1, // Below maxRetries
    failed: false,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  };

  await testingDB.mongodb?.collection('jobs').insertMany([exceededJob, normalJob]);

  const result = await adapter.pickJob('queue name');

  // Should pick the normal job, not the exceeded job
  expect(result).toEqual({
    id: normalJob._id.toHexString(),
    queue: 'queue name',
    name: 'normal job',
    params: {},
    namespace: 'namespace',
    lockedUntil: NOW_VALUE + 1000,
    retryCount: 2, // Incremented from 1
    failed: false,
    options: {
      lockWindow: 1000,
      maxRetries: 3,
    },
  });

  const remainingJobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();
  expect(remainingJobs!).toHaveLength(2); // OTHER_QUEUE_JOB + normalJob (updated) - exceeded job moved to failed

  const failedJobs = await testingDB.mongodb?.collection('jobs_failed').find({}).toArray();
  expect(failedJobs!).toHaveLength(1); // exceeded job should be in failed collection

  const exceededJobAfter = failedJobs!.find(job => job.name === 'exceeded job');
  expect(exceededJobAfter?.retryCount).toBe(3); // Should remain unchanged
  expect(exceededJobAfter?.failed).toBe(true); // Should be marked as failed
});
