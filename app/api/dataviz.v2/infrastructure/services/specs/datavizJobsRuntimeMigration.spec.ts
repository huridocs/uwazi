import { ObjectId } from 'mongodb';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizFactory } from '#api/dataviz.v2/infrastructure/factories/DatavizFactory.js';
import {
  DatavizScheduledRefreshJobHandlerToken,
  DatavizScheduledRefreshJobLegacyToken,
} from '#api/dataviz.v2/application/contracts/DatavizScheduledRefreshJobHandlerToken.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { rescheduleDatavizRefresh } from '../rescheduleDatavizRefresh.js';

/**
 * Scheduled refresh jobs of a postgresCore tenant may still wait in the Mongo queue, dispatched
 * before the tenant switched. They migrate at runtime: the Mongo worker runs them under the
 * tenant's flag and their next run is dispatched to Postgres. Until they do, cancelling must
 * reach them too, or an update leaves two refresh chains behind.
 */

const TENANT = 'dataviz-jobs-migration';
const LATER = Date.UTC(2100, 0, 1);

const datavizId = new ObjectId().toHexString();
const otherDatavizId = new ObjectId().toHexString();

const refreshJob = (name: string, id: string) => ({
  _id: new ObjectId(),
  queue: 'uwazi_jobs',
  name,
  namespace: TENANT,
  params: { datavizId: id, tenantName: TENANT, userId: 'user1' },
  options: { lockWindow: 600000, maxRetries: 5 },
  lockedUntil: LATER,
  createdAt: Date.now(),
  retryCount: 0,
  failed: false,
});

const sharedMongoJobs = () => getSharedConnection().collection('jobs');

const mongoQueueRefreshJobs = async () =>
  (await sharedMongoJobs().find({ namespace: TENANT }).toArray()).map(job => ({
    name: job.name,
    datavizId: job.params.datavizId,
  }));

const postgresQueueRefreshJobs = async () =>
  (await testingEnvironment.jobs.getAll({ postgresCore: true }))
    .filter(job => job.namespace === TENANT)
    .map(job => ({ name: job.name, datavizId: job.params.datavizId }));

const byDataviz = <T extends { datavizId: string; name: string }>(jobs: T[]) =>
  [...jobs].sort((a, b) => `${a.datavizId}${a.name}`.localeCompare(`${b.datavizId}${b.name}`));

const scheduledDataviz = {
  _id: ObjectId.createFromHexString(datavizId),
  name: 'Scheduled',
  query: { sources: [{ templateId: new ObjectId().toHexString() }], dimensions: [], measures: [] },
  chart: { type: 'bar' },
  appearance: { colorMode: 'theme' },
  refresh: { refreshMode: 'snapshot_scheduled', schedule: 'daily', scheduleTime: '02:00' },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('dataviz scheduled refresh jobs runtime migration', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await sharedMongoJobs().deleteMany({ namespace: TENANT });
    await testingEnvironment.jobs.clear();
  });

  afterEach(async () => {
    await sharedMongoJobs().deleteMany({ namespace: TENANT });
  });

  describe('cancelPending()', () => {
    it('should cancel the dataviz jobs in both queues for a postgresCore tenant', async () => {
      testingTenants.changeCurrentTenant({ name: TENANT, featureFlags: { postgresCore: true } });
      await sharedMongoJobs().insertMany([
        refreshJob(DatavizScheduledRefreshJobHandlerToken.name, datavizId),
        refreshJob(DatavizScheduledRefreshJobLegacyToken.name, datavizId),
        refreshJob(DatavizScheduledRefreshJobHandlerToken.name, otherDatavizId),
      ]);
      await testingEnvironment.jobs.insert(
        [
          refreshJob(DatavizScheduledRefreshJobHandlerToken.name, datavizId),
          refreshJob(DatavizScheduledRefreshJobHandlerToken.name, otherDatavizId),
        ],
        { postgresCore: true }
      );

      await testingEnvironment.runWithContext(async () =>
        DatavizFactory.schedulerService().cancelPending(datavizId)
      );

      expect(await mongoQueueRefreshJobs()).toEqual([
        { name: DatavizScheduledRefreshJobHandlerToken.name, datavizId: otherDatavizId },
      ]);
      expect(await postgresQueueRefreshJobs()).toEqual([
        { name: DatavizScheduledRefreshJobHandlerToken.name, datavizId: otherDatavizId },
      ]);
    });
  });

  describe('a refresh job run from the Mongo queue for a postgresCore tenant', () => {
    it('should dispatch its next run to the Postgres queue', async () => {
      testingTenants.changeCurrentTenant({ name: TENANT, featureFlags: { postgresCore: true } });
      await testingEnvironment.setFixtures({ dataviz: [scheduledDataviz] });

      await testingEnvironment.runWithContext(async () =>
        rescheduleDatavizRefresh({
          datavizId,
          tenantName: TENANT,
          userId: 'user1',
          datavizDS: DatavizFactory.dataSource(),
          jobsDispatcher: ExecutionContext.jobsDispatcher,
        })
      );

      expect(byDataviz(await postgresQueueRefreshJobs())).toEqual([
        { name: DatavizScheduledRefreshJobHandlerToken.name, datavizId },
      ]);
      expect(await mongoQueueRefreshJobs()).toEqual([]);
    });
  });
});
