import { ObjectId } from 'mongodb';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { TestingRoundRobinQueueAdapter } from 'api/core/libs/queue/configuration/factories';
import { createTestJob, pickJobs, pushJobsForNamespaces } from './fixtures';
import { RoundRobinMongoQueueAdapter } from '../RoundRobinQueueAdapter';

describe('RoundRobinQueueAdapter', () => {
  let adapter: RoundRobinMongoQueueAdapter;

  beforeEach(async () => {
    await testingEnvironment.setUp();
    await testingDB.connect();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Round Robin Distribution', () => {
    it('should distribute jobs across different tenants in round-robin fashion', async () => {
      adapter = TestingRoundRobinQueueAdapter();

      await pushJobsForNamespaces(adapter, [
        ['testTenant1', 3],
        ['testTenant2', 2],
        ['testTenant3', 2],
      ]);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual([
        'testTenant1',
        'testTenant2',
        'testTenant3',
        'testTenant1',
        'testTenant2',
        'testTenant3',
        'testTenant1',
      ]);
    });

    it('should maintain round-robin order even when some tenants have no jobs', async () => {
      adapter = TestingRoundRobinQueueAdapter();

      await pushJobsForNamespaces(adapter, [
        ['testTenant1', 2],
        ['testTenant2', 1],
        ['testTenant1', 1],
      ]);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual(['testTenant1', 'testTenant2', 'testTenant1', 'testTenant1']);
    });
  });

  describe('Lock and Failure States', () => {
    it('should skip locked jobs when picking next job', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const now = Date.now();
      const lockedJob = createTestJob({
        namespace: 'testTenant1',
        lockedUntil: now + 1000 * 60,
        timestamp: now,
      });
      await adapter.pushJob(lockedJob);
      await pushJobsForNamespaces(adapter, [
        ['testTenant2', 2],
        ['testTenant3', 1],
      ]);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual(['testTenant2', 'testTenant3', 'testTenant2']);
    });

    it('should skip failed jobs when picking next job', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const now = Date.now();
      const failedJob = createTestJob({
        namespace: 'testTenant1',
        failed: true,
        timestamp: now,
      });
      await adapter.pushJob(failedJob);
      await pushJobsForNamespaces(adapter, [
        ['testTenant2', 2],
        ['testTenant3', 1],
      ]);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual(['testTenant2', 'testTenant3', 'testTenant2']);
    });

    it('should automatically mark jobs that exceed maxRetries as failed when picking jobs', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const now = Date.now();

      // Create a job that has exceeded its maxRetries by directly inserting it into the database
      const exceededRetryJobData = {
        _id: new ObjectId(),
        queue: 'test-queue',
        name: 'test-job',
        params: {},
        namespace: 'testTenant1',
        lockedUntil: 0,
        createdAt: now,
        retryCount: 5, // Exceeds maxRetries of 3
        failed: false,
        options: {
          lockWindow: 1000,
          maxRetries: 3,
        },
      };

      await testingDB.mongodb?.collection('jobs').insertOne(exceededRetryJobData);

      await pushJobsForNamespaces(adapter, [
        ['testTenant2', 2],
        ['testTenant3', 1],
      ]);

      const pickedJobs: string[] = await pickJobs(adapter);

      const failedJobs = await testingDB.mongodb?.collection('jobs_failed').find({}).toArray();

      expect(pickedJobs).toEqual(['testTenant2', 'testTenant3', 'testTenant2']);

      expect(failedJobs!).toHaveLength(1);
      expect(failedJobs![0]).toMatchObject({
        namespace: 'testTenant1',
        retryCount: 5,
        failed: true,
        options: {
          lockWindow: 1000,
          maxRetries: 3,
        },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not return any jobs when queue is empty', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual([]);
    });

    it('should not return any jobs when all jobs are locked', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const now = Date.now();
      const lockedJob1 = createTestJob({
        namespace: 'testTenant1',
        lockedUntil: now + 1000 * 60,
        timestamp: now,
      });
      const lockedJob2 = createTestJob({
        namespace: 'testTenant2',
        lockedUntil: now + 1000 * 60,
        timestamp: now + 1,
      });

      await adapter.pushJob(lockedJob1);
      await adapter.pushJob(lockedJob2);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual([]);
    });

    it('should not return any jobs when all jobs are failed', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      const now = Date.now();
      const failedJob1 = createTestJob({
        namespace: 'testTenant1',
        failed: true,
        timestamp: now,
      });
      const failedJob2 = createTestJob({
        namespace: 'testTenant2',
        failed: true,
        timestamp: now + 1,
      });

      await adapter.pushJob(failedJob1);
      await adapter.pushJob(failedJob2);

      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual([]);
    });

    it('should pick jobs in sequence from the same tenant when no other tenants are available', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      await pushJobsForNamespaces(adapter, [['testTenant1', 3]]);
      const pickedJobs: string[] = await pickJobs(adapter);
      expect(pickedJobs).toEqual(['testTenant1', 'testTenant1', 'testTenant1']);
    });

    it('should return the found job with its id', async () => {
      adapter = TestingRoundRobinQueueAdapter();
      await pushJobsForNamespaces(adapter, [['testTenant1', 1]]);
      const job = await adapter.pickJob('test-queue');
      expect(typeof job?.id).toBe('string');
      expect(job?.id.length).toBeGreaterThan(0);
    });
  });
});
