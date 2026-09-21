import { config } from '#api/config.js';
import { ExecutionContext, ExecutionContextDeps } from '#api/core/libs/ExecutionContext.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DB } from '#api/odm/index.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { JobsDispatcherFactory } from '../JobsDispatcherFactory.js';

class JobsDispatcherFactorySpecJob implements Dispatchable {
  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(): Promise<void> {
    throw new Error('not implemented');
  }
}

const JOB_NAME = JobsDispatcherFactorySpecJob.name;

const mongoJobs = async () =>
  DB.mongodb_Db(config.SHARED_DB).collection('jobs').find({ name: JOB_NAME }).toArray();

const postgresJobs = async () =>
  (await testingEnvironment.pg.getAllFrom('jobs')).filter(job => job.name === JOB_NAME);

const inTenantContext = async <T>(
  postgresCore: boolean,
  fn: () => Promise<T>,
  factories: Partial<ExecutionContextDeps['factories']> = {}
) =>
  testingEnvironment.runWithContext(fn, {
    tenant: { ...testingTenants.current(), featureFlags: { postgresCore } },
    factories: { jobsDispatcher: JobsDispatcherFactory.default, ...factories },
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
    it('should dispatch a postgresCore tenant job to Postgres, within its transaction', async () => {
      await inTenantContext(true, async () => ExecutionContext.transactionManager.run(dispatch));

      expect(await postgresJobs()).toEqual([
        expect.objectContaining({
          namespace: testingTenants.current().name,
          params: expect.objectContaining({ aParam: 'value' }),
        }),
      ]);
      expect(await mongoJobs()).toEqual([]);
    });

    it('should roll a postgresCore tenant job back with its transaction', async () => {
      await expect(
        inTenantContext(true, async () =>
          ExecutionContext.transactionManager.run(async () => {
            await dispatch();
            throw new Error('rolled back');
          })
        )
      ).rejects.toThrow('rolled back');

      expect(await postgresJobs()).toEqual([]);
    });

    it("should join the context's transaction manager, whatever instance it is", async () => {
      const contextManager = new PostgresTransactionManager(
        PostgresDB.knex,
        testingTenants.current().name,
        LoggerFactory.default()
      );

      await expect(
        inTenantContext(
          true,
          async () =>
            contextManager.run(async () => {
              await dispatch();
              throw new Error('rolled back');
            }),
          { transactionManager: () => contextManager }
        )
      ).rejects.toThrow('rolled back');

      expect(await postgresJobs()).toEqual([]);
    });

    it('should dispatch a postgresCore tenant job to Postgres outside a transaction', async () => {
      await inTenantContext(true, dispatch);

      expect(await postgresJobs()).toHaveLength(1);
      expect(await mongoJobs()).toEqual([]);
    });

    it('should dispatch a Mongo tenant job to Mongo', async () => {
      await inTenantContext(false, dispatch);

      expect(await mongoJobs()).toEqual([
        expect.objectContaining({ namespace: testingTenants.current().name }),
      ]);
      expect(await postgresJobs()).toEqual([]);
    });
  });

  describe('system()', () => {
    it('should dispatch to the Mongo system namespace', async () => {
      await JobsDispatcherFactory.system().dispatch(JobsDispatcherFactorySpecJob, {});

      expect(await mongoJobs()).toEqual([expect.objectContaining({ namespace: 'system' })]);
      expect(await postgresJobs()).toEqual([]);
    });
  });
});
