import { config } from '#api/config.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CleanupExpiredPasswordRecoveriesJob } from '../cleanupExpiredPasswordRecoveriesJob/CleanupExpiredPasswordRecoveriesJob.js';
import { CleanupExpiredPasswordRecoveriesJobScheduler } from '../cleanupExpiredPasswordRecoveriesJob/CleanupExpiredPasswordRecoveriesJobScheduler.js';

const JOB_NAME = CleanupExpiredPasswordRecoveriesJob.name;

const sharedMongoJobs = () => DB.mongodb_Db(config.SHARED_DB).collection('jobs');

const postgresSystemJobs = async () =>
  (await testingEnvironment.pg.getAllFrom('jobs')).filter(
    job => job.name === JOB_NAME && job.namespace === 'system'
  );

describe('CleanupExpiredPasswordRecoveriesJobScheduler integration', () => {
  const previousSystemJobsBackend = config.systemJobsBackend;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await sharedMongoJobs().deleteMany({ name: JOB_NAME });
    await testingEnvironment.pg.pool!.query('DELETE FROM jobs');
  });

  afterAll(async () => {
    await sharedMongoJobs().deleteMany({ name: JOB_NAME });
    config.systemJobsBackend = previousSystemJobsBackend;
    await testingEnvironment.tearDown();
  });

  it('should insert the system job into the Postgres jobs table when SYSTEM_JOBS_BACKEND is postgres', async () => {
    config.systemJobsBackend = 'postgres';

    await testingEnvironment.runWithContext(async () => {
      await CleanupExpiredPasswordRecoveriesJobScheduler.default().ensureScheduled();
    });

    expect(await postgresSystemJobs()).toEqual([
      expect.objectContaining({ name: JOB_NAME, namespace: 'system', tenant_id: null }),
    ]);
  });

  it('should not double-schedule when a system job already exists', async () => {
    config.systemJobsBackend = 'postgres';
    const scheduler = CleanupExpiredPasswordRecoveriesJobScheduler.default();

    await testingEnvironment.runWithContext(async () => scheduler.ensureScheduled());
    await testingEnvironment.runWithContext(async () => scheduler.ensureScheduled());

    expect(await postgresSystemJobs()).toHaveLength(1);
  });
});
