/* eslint-disable max-statements, max-lines */
import { ObjectId } from 'mongodb';
import { Params } from '../../application/contracts/Dispatchable.js';
import { Job, PushJobInput, QueueAdapter } from '../QueueAdapter.js';

type StoredJob = Job & { failed: boolean };

type QueueAdapterHarness = {
  /** A dispatch-side adapter, as the jobs dispatcher builds it. */
  adapter: () => QueueAdapter;
  /** A fresh round robin adapter, as the queue worker builds it. */
  roundRobinAdapter: () => QueueAdapter;
  insert: (jobs: StoredJob[]) => Promise<void>;
  stored: () => Promise<StoredJob[]>;
};

const newId = () => new ObjectId().toHexString();

const storedJob = (overrides: Partial<StoredJob> = {}): StoredJob => ({
  id: newId(),
  queue: 'queue name',
  name: 'a simple message',
  params: {},
  namespace: 'namespace',
  lockedUntil: 0,
  createdAt: 1,
  retryCount: 0,
  failed: false,
  options: { lockWindow: 1000, maxRetries: 3 },
  ...overrides,
});

const pushInput = (overrides: Partial<PushJobInput> = {}): PushJobInput => ({
  queue: 'queue name',
  name: 'a simple message',
  params: {},
  namespace: 'namespace',
  options: { maxRetries: 3, lockWindow: 500 },
  ...overrides,
});

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

const mockNow = (value: number) => {
  let now = value;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  return (next: number) => {
    now = next;
  };
};

// eslint-disable-next-line max-lines-per-function
function describeQueueAdapterContract(name: string, setUp: () => Promise<QueueAdapterHarness>) {
  describe(`${name} (QueueAdapter contract)`, () => {
    let harness: QueueAdapterHarness;
    let adapter: QueueAdapter;
    const otherQueueJob = storedJob({ queue: 'other queue', name: 'other queue job' });

    const expectStored = async (jobs: StoredJob[]) => {
      expect((await harness.stored()).sort(byId)).toEqual([...jobs].sort(byId));
    };

    const storedIds = async () => (await harness.stored()).map(job => job.id).sort();

    beforeEach(async () => {
      harness = await setUp();
      await harness.insert([otherQueueJob]);
      adapter = harness.adapter();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('pushJob', () => {
      it('should store the job ready to be picked, and return its id', async () => {
        mockNow(1);

        const id = await adapter.pushJob(pushInput());

        await expectStored([
          otherQueueJob,
          {
            id,
            queue: 'queue name',
            name: 'a simple message',
            params: {},
            namespace: 'namespace',
            lockedUntil: 0,
            createdAt: 1,
            retryCount: 0,
            failed: false,
            options: { maxRetries: 3, lockWindow: 500 },
          },
        ]);
      });

      it('should keep a given lockedUntil', async () => {
        mockNow(1);

        const id = await adapter.pushJob(pushInput({ lockedUntil: 5000 }));

        expect((await harness.stored()).find(job => job.id === id)).toMatchObject({
          lockedUntil: 5000,
        });
      });
    });

    describe('pushJobs', () => {
      it('should store every job, and return their ids in order', async () => {
        mockNow(1);

        const ids = await adapter.pushJobs([
          pushInput({ name: 'first', params: { a: 1 } }),
          pushInput({ name: 'second', params: { a: 2 } }),
        ]);

        const stored = await harness.stored();
        expect(ids.map(id => stored.find(job => job.id === id)?.name)).toEqual(['first', 'second']);
      });
    });

    describe('pickJob', () => {
      it('should return null when the queue has no jobs', async () => {
        expect(await adapter.pickJob('queue name')).toBe(null);
      });

      it('should lock the job for its lockWindow and count the attempt', async () => {
        mockNow(11);
        const job = storedJob({ lockedUntil: 10 });
        await harness.insert([job]);

        const picked = await adapter.pickJob('queue name');

        expect(picked).toEqual({ ...job, lockedUntil: 11 + 1000, retryCount: 1 });
        await expectStored([otherQueueJob, { ...job, lockedUntil: 11 + 1000, retryCount: 1 }]);
      });

      it('should not pick a locked job until its lock expires', async () => {
        const setNow = mockNow(1);
        const job = storedJob({ lockedUntil: 10 });
        await harness.insert([job]);

        expect(await adapter.pickJob('queue name')).toBe(null);
        await expectStored([otherQueueJob, job]);

        setNow(11);
        expect(await adapter.pickJob('queue name')).toMatchObject({ id: job.id });
      });

      it('should not pick a job pushed with a future lockedUntil until it expires', async () => {
        const setNow = mockNow(1000);
        await adapter.pushJob(pushInput({ name: 'delayed job', lockedUntil: 6000 }));

        expect(await adapter.pickJob('queue name')).toBe(null);

        setNow(6001);
        expect(await adapter.pickJob('queue name')).toMatchObject({
          name: 'delayed job',
          lockedUntil: 6001 + 500,
          retryCount: 1,
        });
      });

      it.each([{ reversed: false }, { reversed: true }])(
        'should pick the oldest job first (inserted reversed: $reversed)',
        async ({ reversed }) => {
          mockNow(10);
          const older = storedJob({ createdAt: 1 });
          const newer = storedJob({ createdAt: 2 });
          await harness.insert(reversed ? [newer, older] : [older, newer]);

          const first = await adapter.pickJob('queue name');
          const second = await adapter.pickJob('queue name');

          expect([first?.id, second?.id]).toEqual([older.id, newer.id]);
        }
      );

      it('should break ties on creation time by id', async () => {
        mockNow(10);
        const [lowerId, higherId] = [newId(), newId()].sort();
        await harness.insert([storedJob({ id: higherId }), storedJob({ id: lowerId })]);

        const first = await adapter.pickJob('queue name');
        const second = await adapter.pickJob('queue name');

        expect([first?.id, second?.id]).toEqual([lowerId, higherId]);
      });

      it('should not pick failed jobs', async () => {
        mockNow(10);
        await harness.insert([storedJob({ failed: true })]);

        expect(await adapter.pickJob('queue name')).toBe(null);
      });

      it('should not pick jobs that reached maxRetries, and pick the next one', async () => {
        mockNow(10);
        const exhausted = storedJob({ name: 'exhausted job', retryCount: 3 });
        const retriable = storedJob({ name: 'retriable job', createdAt: 2, retryCount: 1 });
        await harness.insert([exhausted, retriable]);

        expect(await adapter.pickJob('queue name')).toEqual({
          ...retriable,
          lockedUntil: 10 + 1000,
          retryCount: 2,
        });
        expect(await adapter.pickJob('queue name')).toBe(null);
      });

      it('should not pick a job again once its last attempt lock expires', async () => {
        const setNow = mockNow(1000);
        const job = storedJob({ retryCount: 2, options: { lockWindow: 5000, maxRetries: 3 } });
        await harness.insert([job]);

        expect(await adapter.pickJob('queue name')).toMatchObject({
          id: job.id,
          retryCount: 3,
          lockedUntil: 6000,
        });

        setNow(7000);
        expect(await adapter.pickJob('queue name')).toBe(null);
      });

      it('should mark the queue jobs that reached maxRetries as failed once their lock expires', async () => {
        mockNow(10);
        const exhausted = storedJob({ name: 'exhausted job', retryCount: 3, lockedUntil: 5 });
        const otherQueueExhausted = storedJob({
          queue: 'other queue',
          name: 'other queue exhausted job',
          retryCount: 3,
        });
        await harness.insert([exhausted, otherQueueExhausted]);

        await adapter.pickJob('queue name');

        await expectStored([otherQueueJob, otherQueueExhausted, { ...exhausted, failed: true }]);
      });

      it('should not mark a job as failed while its last attempt is still locked', async () => {
        mockNow(10);
        const running = storedJob({ name: 'last attempt', retryCount: 3, lockedUntil: 20 });
        await harness.insert([running]);

        await adapter.pickJob('queue name');

        await expectStored([otherQueueJob, running]);
      });
    });

    describe('worker side updates', () => {
      it('should renew the lock of a job for its lockWindow', async () => {
        mockNow(1);
        const job = storedJob({ options: { lockWindow: 2000, maxRetries: 5 } });
        await harness.insert([job]);

        await adapter.renewJobLock(job);

        await expectStored([otherQueueJob, { ...job, lockedUntil: 1 + 2000 }]);
      });

      it('should delete a job', async () => {
        const job = storedJob();
        await harness.insert([job]);

        await adapter.deleteJob(job);

        await expectStored([otherQueueJob]);
      });

      it('should mark a job as failed, and return it', async () => {
        const job = storedJob();
        await harness.insert([job]);

        const failed = await adapter.markJobAsFailed(job);

        expect(failed).toMatchObject({ id: job.id, failed: true });
        await expectStored([otherQueueJob, { ...job, failed: true }]);
      });

      it('should throw when marking a job that does not exist as failed', async () => {
        await expect(adapter.markJobAsFailed(storedJob())).rejects.toThrow(
          'Failed to mark job as failed'
        );
      });

      it('should update the lock window of a job, and return it', async () => {
        const job = storedJob();
        await harness.insert([job]);

        const updated = await adapter.updateLockWindow(job, 4000);

        expect(updated).toMatchObject({ id: job.id, options: { lockWindow: 4000, maxRetries: 3 } });
        await expectStored([
          otherQueueJob,
          { ...job, options: { lockWindow: 4000, maxRetries: 3 } },
        ]);
      });

      it('should throw when updating the lock window of a job that does not exist', async () => {
        await expect(adapter.updateLockWindow(storedJob(), 4000)).rejects.toThrow(
          'Failed to update lock window for job'
        );
      });
    });

    describe('deleteByParams and cancelByParams', () => {
      const jobs = {
        numberAndString: storedJob({
          namespace: 'tenant1',
          name: 'job1',
          params: { a: 1, b: '1' },
        }),
        number: storedJob({ namespace: 'tenant1', name: 'job2', params: { a: 1 } }),
        otherNumber: storedJob({ namespace: 'tenant1', name: 'job3', params: { a: 2 } }),
        booleanAndNull: storedJob({
          namespace: 'tenant1',
          name: 'job4',
          params: { c: true, d: null },
        }),
        arrayAndObject: storedJob({
          namespace: 'tenant1',
          name: 'job5',
          params: { e: ['item1', 'item2'], f: { nested: 'object' } },
        }),
        otherTenant: storedJob({ namespace: 'tenant2', name: 'job2', params: { a: 1 } }),
      };
      const allIds = Object.values(jobs).map(job => job.id);
      const idsWithout = (...removed: StoredJob[]) =>
        [otherQueueJob.id, ...allIds.filter(id => !removed.some(job => job.id === id))].sort();

      beforeEach(async () => {
        mockNow(1000);
        await harness.insert(Object.values(jobs));
      });

      it.each([
        { case: 'a numeric param', jobName: 'job1', params: { a: 1 }, removed: 'numberAndString' },
        {
          case: 'every param (AND)',
          jobName: 'job1',
          params: { a: 1, b: '1' },
          removed: 'numberAndString',
        },
        { case: 'a string param', jobName: 'job1', params: { b: '1' }, removed: 'numberAndString' },
        {
          case: 'a boolean param',
          jobName: 'job4',
          params: { c: true },
          removed: 'booleanAndNull',
        },
        {
          case: 'an array param',
          jobName: 'job5',
          params: { e: ['item1', 'item2'] },
          removed: 'arrayAndObject',
        },
        {
          case: 'an object param',
          jobName: 'job5',
          params: { f: { nested: 'object' } },
          removed: 'arrayAndObject',
        },
        { case: 'name and params only', jobName: 'job2', params: { a: 1 }, removed: 'number' },
      ] as { case: string; jobName: string; params: Params; removed: keyof typeof jobs }[])(
        'should delete the jobs matching $case',
        async ({ jobName, params, removed }) => {
          await adapter.deleteByParams(jobName, params, 'tenant1');

          expect(await storedIds()).toEqual(idsWithout(jobs[removed]));
        }
      );

      it.each([
        { case: 'a param no job has', params: { nonExistent: 'value' } },
        { case: 'a param value no job has', params: { a: 999 } },
        { case: 'no params', params: {} },
      ])('should delete nothing given $case', async ({ params }) => {
        await adapter.deleteByParams('job1', params, 'tenant1');

        expect(await storedIds()).toEqual(idsWithout());
      });

      it('should not delete locked jobs', async () => {
        const lockedJob = { namespace: 'tenant1', name: 'job6', params: { a: 1 } };
        const locked = storedJob({ ...lockedJob, lockedUntil: 6000 });
        const expired = storedJob({ ...lockedJob, lockedUntil: 900 });
        await harness.insert([locked, expired]);

        await adapter.deleteByParams('job6', { a: 1 }, 'tenant1');

        expect(await storedIds()).toEqual([...idsWithout(), locked.id].sort());
      });

      it('should cancel matching jobs whether they are locked or not', async () => {
        const locked = storedJob({
          namespace: 'tenant1',
          name: 'scheduled_job',
          lockedUntil: 6000,
          params: { datavizId: 'dv1' },
        });
        await harness.insert([locked]);

        await adapter.cancelByParams('scheduled_job', { datavizId: 'dv1' }, 'tenant1');
        await adapter.cancelByParams('job2', { a: 1 }, 'tenant1');

        expect(await storedIds()).toEqual(idsWithout(jobs.number));
      });

      it('should cancel nothing given no params', async () => {
        await adapter.cancelByParams('job1', {}, 'tenant1');

        expect(await storedIds()).toEqual(idsWithout());
      });
    });

    describe('countByName', () => {
      it('should count the jobs with a name in a namespace, failed ones included', async () => {
        await harness.insert([
          storedJob({ namespace: 'tenant1', name: 'jobA' }),
          storedJob({ namespace: 'tenant1', name: 'jobA', failed: true }),
          storedJob({ namespace: 'tenant1', name: 'jobB' }),
          storedJob({ namespace: 'tenant2', name: 'jobA' }),
        ]);

        expect(await adapter.countByName('jobA', 'tenant1')).toBe(2);
        expect(await adapter.countByName('jobB', 'tenant1')).toBe(1);
        expect(await adapter.countByName('jobA', 'tenant2')).toBe(1);
        expect(await adapter.countByName('jobA', 'tenant3')).toBe(0);
      });
    });

    describe('round robin', () => {
      let roundRobin: QueueAdapter;

      const insertForNamespaces = async (counts: [string, number, Partial<StoredJob>?][]) => {
        const namespaces = counts.flatMap(([namespace, count, overrides]) =>
          Array.from({ length: count }, () => ({ namespace, ...overrides }))
        );
        await harness.insert(
          namespaces.map((overrides, index) => storedJob({ ...overrides, createdAt: index + 1 }))
        );
      };

      const pickAll = async (picked: string[] = []): Promise<string[]> => {
        const job = await roundRobin.pickJob('queue name');
        return job ? pickAll([...picked, job.namespace]) : picked;
      };

      beforeEach(() => {
        mockNow(1000);
        roundRobin = harness.roundRobinAdapter();
      });

      it('should alternate between tenants', async () => {
        await insertForNamespaces([
          ['tenant1', 3],
          ['tenant2', 2],
          ['tenant3', 2],
        ]);

        expect(await pickAll()).toEqual([
          'tenant1',
          'tenant2',
          'tenant3',
          'tenant1',
          'tenant2',
          'tenant3',
          'tenant1',
        ]);
      });

      it('should keep alternating when a tenant runs out of jobs', async () => {
        await insertForNamespaces([
          ['tenant1', 2],
          ['tenant2', 1],
          ['tenant1', 1],
        ]);

        expect(await pickAll()).toEqual(['tenant1', 'tenant2', 'tenant1', 'tenant1']);
      });

      it('should pick from the same tenant when no other tenant has jobs', async () => {
        await insertForNamespaces([['tenant1', 3]]);

        expect(await pickAll()).toEqual(['tenant1', 'tenant1', 'tenant1']);
      });

      it.each([
        { case: 'locked', overrides: { lockedUntil: 1000 + 60_000 } },
        { case: 'failed', overrides: { failed: true } },
      ])('should skip $case jobs', async ({ overrides }) => {
        await insertForNamespaces([
          ['tenant1', 1, overrides],
          ['tenant2', 2],
          ['tenant3', 1],
        ]);

        expect(await pickAll()).toEqual(['tenant2', 'tenant3', 'tenant2']);
      });

      it('should return the picked job with its id', async () => {
        await insertForNamespaces([['tenant1', 1]]);

        const job = await roundRobin.pickJob('queue name');

        expect(job).toMatchObject({ id: expect.any(String), namespace: 'tenant1', retryCount: 1 });
      });
    });
  });
}

export { describeQueueAdapterContract, storedJob, pushInput, mockNow };
export type { QueueAdapterHarness, StoredJob };
