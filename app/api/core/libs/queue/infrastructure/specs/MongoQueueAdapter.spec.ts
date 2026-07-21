/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import testingDB from '#api/utils/testing_db.js';
import { ObjectId } from 'mongodb';
import { DefaultTestingQueueAdapter } from '#api/core/libs/queue/configuration/factories.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { createTestJob } from './fixtures.js';
import { JobDBO } from '../MongoQueueAdapter.js';

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

it('should not pick a job pushed with a future lockedUntil until it expires', async () => {
  const adapter = DefaultTestingQueueAdapter();
  let NOW_VALUE = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);

  await adapter.pushJob({
    queue: 'queue name',
    name: 'delayed job',
    params: {},
    namespace: 'namespace',
    lockedUntil: NOW_VALUE + 5000,
    options: {
      maxRetries: 3,
      lockWindow: 500,
    },
  });

  let result = await adapter.pickJob('queue name');
  expect(result).toBe(null);

  NOW_VALUE = 6001;
  result = await adapter.pickJob('queue name');

  expect(result).toMatchObject({
    name: 'delayed job',
    namespace: 'namespace',
    lockedUntil: NOW_VALUE + 500,
    retryCount: 1,
  });
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
  it('should set the job as failed', async () => {
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

    const [failedJob] = await testingDB
      .mongodb!.collection('jobs')
      .find({ failed: true })
      .toArray();

    expect(failedJob).toMatchObject({
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

    const mainJobs = (await testingEnvironment.db.getAllFrom('jobs')).filter(f => !f.failed);
    const failedJobs = (await testingEnvironment.db.getAllFrom('jobs')).filter(f => f.failed);

    expect(mainJobs).toEqual([OTHER_QUEUE_JOB]);
    expect(failedJobs!).toHaveLength(3);

    const failedJobNames = failedJobs!.map(job => job.name).sort();
    expect(failedJobNames).toEqual([
      'exceeded retry job 1',
      'exceeded retry job 2',
      'exceeded retry job 3',
    ]);
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

  const remainingJobs = (await testingEnvironment.db.getAllFrom('jobs')).filter(f => !f.failed);
  expect(remainingJobs).toHaveLength(2);

  const failedJobs = (await testingEnvironment.db.getAllFrom('jobs')).filter(f => f.failed);
  expect(failedJobs!).toHaveLength(1);

  const exceededJobAfter = failedJobs!.find(job => job.name === 'exceeded job');
  expect(exceededJobAfter?.retryCount).toBe(3);
  expect(exceededJobAfter?.failed).toBe(true);
});

it('should not mark locked jobs as failed even if they have exceeded maxRetries', async () => {
  const adapter = DefaultTestingQueueAdapter();
  let NOW_VALUE = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => NOW_VALUE);

  const job = {
    _id: new ObjectId(),
    queue: 'queue name',
    name: 'job about to reach max retries',
    params: {},
    namespace: 'namespace',
    lockedUntil: 0,
    createdAt: NOW_VALUE,
    retryCount: 2,
    failed: false,
    options: {
      lockWindow: 5000,
      maxRetries: 3,
    },
  };

  await testingDB.mongodb?.collection('jobs').insertOne(job);

  const pickedJob = await adapter.pickJob('queue name');

  expect(pickedJob).toMatchObject({
    id: job._id.toHexString(),
    retryCount: 3,
    lockedUntil: NOW_VALUE + 5000,
  });

  NOW_VALUE = 3000;

  const secondPickResult = await adapter.pickJob('queue name');

  expect(secondPickResult).toBeNull();

  const jobsInCollection = await testingDB.mongodb?.collection('jobs').find({}).toArray();
  const ourJob = jobsInCollection?.find(j => j._id.equals(job._id));

  expect(ourJob?.failed).toBe(false);
  expect(ourJob?.lockedUntil).toBe(6000);

  NOW_VALUE = 7000;

  const thirdPickResult = await adapter.pickJob('queue name');

  expect(thirdPickResult).toBeNull();

  const finalJobs = await testingDB.mongodb?.collection('jobs').find({}).toArray();
  const finalJob = finalJobs?.find(j => j._id.equals(job._id));

  expect(finalJob?.failed).toBe(true);
});

describe('deleteByParams', () => {
  const factory = getFixturesFactory();

  beforeEach(async () => {
    await testingEnvironment.setFixtures({
      jobs: [
        {
          _id: factory.id('job1_1'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'job1',
          params: { a: 1, b: '1' },
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job1_2'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'job2',
          params: { a: 1 },
          lockedUntil: 0,
          retryCount: 0,
        },

        {
          _id: factory.id('job1_3'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'job3',
          params: { a: 2 },
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job1_4'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'job4',
          params: { c: true, d: null },
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job1_5'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'job5',
          params: { e: ['item1', 'item2'], f: { nested: 'object' } },
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job1_6'),
          namespace: 'tenant2',
          queue: 'queue1',
          name: 'job2',
          params: { a: 1 },
          lockedUntil: 0,
          retryCount: 0,
        },
      ] as JobDBO[],
    });
  });

  it('should not delete jobs that are currently running (locked)', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const NOW_VALUE = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

    await testingEnvironment.setFixtures({
      jobs: [
        {
          _id: factory.id('locked_job'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'locked_job',
          params: { a: 1 },
          lockedUntil: NOW_VALUE + 5000, // Locked for 5 more seconds
          retryCount: 0,
        },
        {
          _id: factory.id('unlocked_job'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'unlocked_job',
          params: { a: 1 },
          lockedUntil: NOW_VALUE - 100, // Lock expired
          retryCount: 0,
        },
      ] as JobDBO[],
    });

    await adapter.deleteByParams('unlocked_job', { a: 1 }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(1);
    expect(after).toEqual(TestUtils.arrayIncludesObjects([{ _id: factory.id('locked_job') }]));
  });

  it('should cancel jobs with future lockedUntil via cancelByParams', async () => {
    const adapter = DefaultTestingQueueAdapter();
    const NOW_VALUE = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(NOW_VALUE);

    await testingEnvironment.setFixtures({
      jobs: [
        {
          _id: factory.id('locked_job'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'scheduled_job',
          params: { datavizId: 'dv1' },
          lockedUntil: NOW_VALUE + 5000,
          retryCount: 0,
        },
      ] as JobDBO[],
    });

    await adapter.cancelByParams('scheduled_job', { datavizId: 'dv1' }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');
    expect(after).toHaveLength(0);
  });

  it('should delete jobs matching a single numeric param', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', { a: 1 }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_5') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete jobs matching multiple params (AND condition)', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', { a: 1, b: '1' }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_5') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete jobs matching a string param', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', { b: '1' }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_5') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete jobs matching a boolean param', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job4', { c: true }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_1') },
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_5') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete jobs matching an array param', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job5', { e: ['item1', 'item2'] }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_1') },
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete jobs matching an object param', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job5', { f: { nested: 'object' } }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_1') },
        { _id: factory.id('job1_2') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_6') },
      ])
    );
  });

  it('should delete nothing when param does not match any job', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', { nonExistent: 'value' }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(6);
  });

  it('should delete nothing when param value does not match', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', { a: 999 }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(6);
  });

  it('should handle empty params object by deleting nothing', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job1', {}, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(6);
  });

  it('should only delete jobs matching both job name and params', async () => {
    const adapter = DefaultTestingQueueAdapter();

    await adapter.deleteByParams('job2', { a: 1 }, 'tenant1');

    const after = await testingEnvironment.db.getAllFrom('jobs');

    expect(after).toHaveLength(5);
    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        { _id: factory.id('job1_1') },
        { _id: factory.id('job1_3') },
        { _id: factory.id('job1_4') },
        { _id: factory.id('job1_5') },
        { _id: factory.id('job1_6') },
      ])
    );
  });
});

describe('countByName', () => {
  const factory = getFixturesFactory();

  beforeEach(async () => {
    await testingEnvironment.setFixtures({
      jobs: [
        {
          _id: factory.id('job_a_1'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'jobA',
          params: {},
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job_a_2'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'jobA',
          params: {},
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job_b_1'),
          namespace: 'tenant1',
          queue: 'queue1',
          name: 'jobB',
          params: {},
          lockedUntil: 0,
          retryCount: 0,
        },
        {
          _id: factory.id('job_a_other_tenant'),
          namespace: 'tenant2',
          queue: 'queue1',
          name: 'jobA',
          params: {},
          lockedUntil: 0,
          retryCount: 0,
        },
      ] as JobDBO[],
    });
  });

  it('should count jobs by name and namespace', async () => {
    const adapter = DefaultTestingQueueAdapter();

    expect(await adapter.countByName('jobA', 'tenant1')).toBe(2);
    expect(await adapter.countByName('jobB', 'tenant1')).toBe(1);
    expect(await adapter.countByName('jobA', 'tenant2')).toBe(1);
    expect(await adapter.countByName('jobA', 'tenant3')).toBe(0);
  });
});
