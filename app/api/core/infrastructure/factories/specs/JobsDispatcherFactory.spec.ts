import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DB } from '#api/odm/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { JobsDispatcherFactory } from '../JobsDispatcherFactory.js';

class JobsDispatcherFactorySpecJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(_heartbeat: HeartbeatCallback, _params: { aParam?: string }): Promise<void> {
    throw new Error('not implemented');
  }
}

const JOB_NAME = JobsDispatcherFactorySpecJob.name;

const mongoJobs = async () =>
  DB.mongodb_Db(config.SHARED_DB).collection('jobs').find({ name: JOB_NAME }).toArray();

const postgresJobs = async () =>
  (await testingEnvironment.pg.getAllFrom('jobs')).filter(job => job.name === JOB_NAME);

const inTenantContext = async <T>(postgresCore: boolean, fn: () => Promise<T>) =>
  testingEnvironment.runWithContext(fn, {
    tenant: { ...testingTenants.current(), featureFlags: { postgresCore } },
    factories: { jobsDispatcher: JobsDispatcherFactory.default },
  });

const dispatch = async () =>
  ExecutionContext.jobsDispatcher.dispatch(JobsDispatcherFactorySpecJob, { aParam: 'value' });

describe('JobsDispatcherFactory', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await DB.mongodb_Db(config.SHARED_DB).collection('jobs').deleteMany({ name: JOB_NAME });
    await testingEnvironment.pg.pool!.query('DELETE FROM jobs');
  });

  afterAll(async () => {
    await DB.mongodb_Db(config.SHARED_DB).collection('jobs').deleteMany({ name: JOB_NAME });
    await testingEnvironment.tearDown();
  });

  describe('default()', () => {
    it('should dispatch a postgresCore tenant job to Postgres', async () => {
      await inTenantContext(true, dispatch);

      expect(await postgresJobs()).toEqual([
        expect.objectContaining({
          namespace: testingTenants.current().name,
          params: expect.objectContaining({ aParam: 'value' }),
        }),
      ]);
      expect(await mongoJobs()).toEqual([]);
    });

    it('should dispatch a Mongo tenant job to Mongo', async () => {
      await inTenantContext(false, dispatch);

      expect(await mongoJobs()).toEqual([
        expect.objectContaining({ namespace: testingTenants.current().name }),
      ]);
      expect(await postgresJobs()).toEqual([]);
    });

    it.each([
      { postgresCore: true, jobs: postgresJobs },
      { postgresCore: false, jobs: mongoJobs },
    ])(
      'should commit the job with the use case transaction (postgresCore: $postgresCore)',
      async ({ postgresCore, jobs }) => {
        await inTenantContext(postgresCore, async () =>
          ExecutionContext.transactionManager.run(dispatch)
        );

        expect(await jobs()).toHaveLength(1);
      }
    );

    it.each([
      { postgresCore: true, jobs: postgresJobs },
      { postgresCore: false, jobs: mongoJobs },
    ])(
      'should roll the job back with the use case transaction (postgresCore: $postgresCore)',
      async ({ postgresCore, jobs }) => {
        await expect(
          inTenantContext(postgresCore, async () =>
            ExecutionContext.transactionManager.run(async () => {
              await dispatch();
              throw new Error('rolled back');
            })
          )
        ).rejects.toThrow('rolled back');

        expect(await jobs()).toEqual([]);
      }
    );
  });

  describe('system()', () => {
    it('should dispatch to the Mongo system namespace', async () => {
      await JobsDispatcherFactory.system().dispatch(JobsDispatcherFactorySpecJob, {});

      expect(await mongoJobs()).toEqual([expect.objectContaining({ namespace: 'system' })]);
      expect(await postgresJobs()).toEqual([]);
    });
  });
});
