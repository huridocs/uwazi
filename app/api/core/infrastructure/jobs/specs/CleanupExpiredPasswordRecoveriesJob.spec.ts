import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { CleanupExpiredPasswordRecoveriesJob } from '../cleanupExpiredPasswordRecoveriesJob/CleanupExpiredPasswordRecoveriesJob.js';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type SeedRow = { _id: string; tenant_id: string; key: string; userId: string; expiresAt: string };

const insertRows = async (rows: SeedRow[]) => {
  for (const row of rows) {
    // eslint-disable-next-line no-await-in-loop
    await testingPG.pool!.query(
      'INSERT INTO password_recoveries ("_id", "tenant_id", "key", "userId", "expiresAt") ' +
        'VALUES ($1, $2, $3, $4, $5)',
      [row._id, row.tenant_id, row.key, row.userId, row.expiresAt]
    );
  }
};

const noopHeartbeat = async () => undefined;

const makeJob = (pool: { query: jest.Mock } | typeof testingPG.pool) => {
  const jobsDispatcher = { dispatch: jest.fn() } as any;
  const job = new CleanupExpiredPasswordRecoveriesJob({ pool: pool as any, jobsDispatcher });
  return { job, jobsDispatcher };
};

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['password_recoveries']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('CleanupExpiredPasswordRecoveriesJob', () => {
  it('should delete expired rows across all tenants in a single run, leaving valid ones', async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + ONE_DAY_IN_MS).toISOString();

    await insertRows([
      {
        _id: 'a-expired',
        tenant_id: TENANT_A,
        key: 'a-expired-key',
        userId: 'user-a',
        expiresAt: past,
      },
      {
        _id: 'a-valid',
        tenant_id: TENANT_A,
        key: 'a-valid-key',
        userId: 'user-a',
        expiresAt: future,
      },
      {
        _id: 'b-expired',
        tenant_id: TENANT_B,
        key: 'b-expired-key',
        userId: 'user-b',
        expiresAt: past,
      },
      {
        _id: 'b-valid',
        tenant_id: TENANT_B,
        key: 'b-valid-key',
        userId: 'user-b',
        expiresAt: future,
      },
    ]);

    const { job } = makeJob(testingPG.pool!);
    await job.handleDispatch(noopHeartbeat);

    const remaining = await testingPG.getAllFrom<{ _id: string }>('password_recoveries');
    expect(remaining.map(r => r._id).sort()).toEqual(['a-valid', 'b-valid']);
  });

  it('should re-dispatch itself for the next run after a successful cleanup', async () => {
    const { job, jobsDispatcher } = makeJob(testingPG.pool!);

    const before = Date.now();
    await job.handleDispatch(noopHeartbeat);
    const after = Date.now();

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
    const [dispatchedClass, params, options] = jobsDispatcher.dispatch.mock.calls[0];
    expect(dispatchedClass).toBe(CleanupExpiredPasswordRecoveriesJob);
    expect(params).toEqual({});
    expect(options.lockedUntil).toBeGreaterThanOrEqual(before + ONE_DAY_IN_MS);
    expect(options.lockedUntil).toBeLessThanOrEqual(after + ONE_DAY_IN_MS);
  });

  it('should still re-dispatch itself even when the delete query fails', async () => {
    const failingPool = { query: jest.fn().mockRejectedValue(new Error('db down')) };
    const { job, jobsDispatcher } = makeJob(failingPool);

    await expect(job.handleDispatch(noopHeartbeat)).rejects.toThrow('db down');
    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should NOT re-dispatch when a failed attempt still has retries left', async () => {
    const failingPool = { query: jest.fn().mockRejectedValue(new Error('db down')) };
    const { job, jobsDispatcher } = makeJob(failingPool);

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 1, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('db down');

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('should re-dispatch when the final retry attempt still fails, so the chain survives', async () => {
    const failingPool = { query: jest.fn().mockRejectedValue(new Error('db down')) };
    const { job, jobsDispatcher } = makeJob(failingPool);

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 5, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('db down');

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should re-dispatch on success regardless of retry position', async () => {
    const { job, jobsDispatcher } = makeJob(testingPG.pool!);

    await job.handleDispatch(
      noopHeartbeat,
      {},
      { retryCount: 2, maxRetries: 5, namespace: 'system' }
    );

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
  });
});
