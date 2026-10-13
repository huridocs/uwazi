import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { ScheduleActivityLogArchivesJobFactory } from '../../factories/ScheduleActivityLogArchivesJobFactory.js';
import { ArchiveActivityOverflowJobHandler } from '../ArchiveActivityOverflowJobHandler.js';
import { ScheduleActivityLogArchivesJob } from '../ScheduleActivityLogArchivesJob.js';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/** A tenant is due once it holds what it may keep plus one whole file: 4 + 3. */
const LIMITS = { maxRows: 4, chunkRows: 3 };

const DUE = 'activitylog-due';
const ALSO_DUE = 'activitylog-also-due';
const NOT_DUE = 'activitylog-not-due';
const ON_MONGO = 'activitylog-on-mongo';
const UNKNOWN = 'activitylog-unknown';

const REGISTERED = [
  { name: DUE, postgresCore: true },
  { name: ALSO_DUE, postgresCore: true },
  { name: NOT_DUE, postgresCore: true },
  { name: ON_MONGO, postgresCore: false },
];

const rowsOf = (tenant: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    _id: `${tenant}-${index + 1}`,
    tenant_id: tenant,
    method: 'POST',
    url: `/api/${index + 1}`,
    params: null,
    query: null,
    body: '{}',
    user_id: null,
    username: null,
    time: index + 1,
  }));

const noopHeartbeat = async () => undefined;

/** The admin pool reads across tenants; under test only the testing pool may. */
const run = async () =>
  testingEnvironment.runWithContext(async () =>
    ScheduleActivityLogArchivesJobFactory.default({
      ...LIMITS,
      pool: testingPG.pool!,
    }).handleDispatch(noopHeartbeat)
  );

/** Jobs sent to tenants go to the Postgres queue, each in its tenant's namespace. */
const tenantJobs = async () =>
  (await testingEnvironment.jobs.getAll({ postgresCore: true }))
    .map(({ name, namespace }) => ({ name, namespace }))
    .sort((a, b) => a.namespace.localeCompare(b.namespace));

/** The job's own next run goes through the context's dispatcher, Mongo for the testing tenant. */
const nextRuns = async () =>
  (await testingEnvironment.jobs.getAll({ postgresCore: false })).filter(
    job => job.name === ScheduleActivityLogArchivesJob.name
  );

const makeFailingJob = () => {
  const jobsDispatcher = { dispatch: jest.fn() } as any;
  const dispatchedTo = jest.fn();
  const job = new ScheduleActivityLogArchivesJob({
    pool: { query: jest.fn().mockRejectedValue(new Error('db down')) } as any,
    jobsDispatcher,
    dispatcherFor: dispatchedTo,
    tenantNames: [DUE],
    dueFrom: 7,
  });
  return { job, jobsDispatcher, dispatchedTo };
};

describe('ScheduleActivityLogArchivesJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    REGISTERED.forEach(({ name, postgresCore }) => {
      tenants.add({ name, dbName: name, featureFlags: { postgresCore } });
    });
  });

  beforeEach(async () => {
    await testingEnvironment.jobs.clear();
    await testingEnvironment.setFixtures(
      {},
      {
        activitylogs: [
          ...rowsOf(DUE, 7),
          ...rowsOf(ALSO_DUE, 9),
          ...rowsOf(NOT_DUE, 6),
          ...rowsOf(ON_MONGO, 9),
          ...rowsOf(UNKNOWN, 9),
        ],
      }
    );
  });

  afterAll(async () => {
    REGISTERED.forEach(({ name }) => {
      delete tenants.tenants[name];
    });
    await testingEnvironment.tearDown();
  });

  it('should send an archive job to every Postgres tenant holding a whole file of overflow', async () => {
    await run();

    expect(await tenantJobs()).toEqual([
      { name: ArchiveActivityOverflowJobHandler.name, namespace: ALSO_DUE },
      { name: ArchiveActivityOverflowJobHandler.name, namespace: DUE },
    ]);
  });

  it('should send nothing when no tenant is due', async () => {
    await testingEnvironment.setFixtures({}, { activitylogs: rowsOf(NOT_DUE, 6) });

    await run();

    expect(await tenantJobs()).toEqual([]);
  });

  it('should schedule its next run for a day later', async () => {
    const before = Date.now();
    await run();
    const after = Date.now();

    const [next, ...others] = await nextRuns();
    expect(others).toEqual([]);
    expect(next.lockedUntil).toBeGreaterThanOrEqual(before + ONE_DAY_IN_MS);
    expect(next.lockedUntil).toBeLessThanOrEqual(after + ONE_DAY_IN_MS);
  });

  it('should not schedule its next run when it failed and will be retried', async () => {
    const { job, jobsDispatcher, dispatchedTo } = makeFailingJob();

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 1, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('db down');

    expect(jobsDispatcher.dispatch).not.toHaveBeenCalled();
    expect(dispatchedTo).not.toHaveBeenCalled();
  });

  it('should schedule its next run when its last attempt failed, so the chain survives', async () => {
    const { job, jobsDispatcher } = makeFailingJob();

    await expect(
      job.handleDispatch(noopHeartbeat, {}, { retryCount: 5, maxRetries: 5, namespace: 'system' })
    ).rejects.toThrow('db down');

    expect(jobsDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(jobsDispatcher.dispatch.mock.calls[0][0]).toBe(ScheduleActivityLogArchivesJob);
  });
});
