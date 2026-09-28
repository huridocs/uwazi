import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { testingDB } from '#api/utils/testing_db.js';
import { DeleteTenantController } from '../DeleteTenantController.js';
import { RecordHealthCheckController } from '../RecordHealthCheckController.js';
import { RegisterTenantController } from '../RegisterTenantController.js';
import { SetFeatureFlagsController } from '../SetFeatureFlagsController.js';
import { SetMaintenanceController } from '../SetMaintenanceController.js';
import { UpdateStatsController } from '../UpdateStatsController.js';
import { UpdateTenantController } from '../UpdateTenantController.js';

const names = ['cli-write-a', 'cli-write-new'];

const stats = {
  lastUpdated: 1,
  dbStorage: 1,
  elasticStorage: 1,
  filesStorage: 1,
  entitiesCount: 1,
  filesCount: 1,
  totalStorage: 1,
  userCount: { admin: 1, editor: 1, collaborator: 1, total: 3 },
  lastSession: 1,
};

const healthCheck = {
  name: 'disk',
  lastUpdated: 1,
  warnings: [],
  problems: ['full'],
  summary: { used: 100 },
};

/**
 * The controllers are wiring: each one's behaviour is proven against the use cases in
 * `app/api/tenants/application/specs`. What is checked here is that the request reaches the right
 * use case and that what comes back is the whole stored row.
 */
describe('tenants write controllers', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('tenants').insertOne({
      name: 'cli-write-a',
      dbName: 'cli-write-a',
      domain: 'a.uwazi.io',
      featureFlags: { fileCacheHeaders: true },
    });
  });

  it('should register a tenant, deriving what it was not given', async () => {
    const output = await RegisterTenantController.handle({ name: 'cli-write-new' });

    expect(output).toMatchObject({
      name: 'cli-write-new',
      dbName: 'cli-write-new',
      activityLogs: 'cli-write-new/log',
    });
  });

  it('should update a tenant, removing what was sent as null', async () => {
    const output = await UpdateTenantController.handle({ name: 'cli-write-a', domain: null });

    expect(output).not.toHaveProperty('domain');
  });

  it('should merge feature flags', async () => {
    const output = await SetFeatureFlagsController.handle({
      name: 'cli-write-a',
      featureFlags: { postgresCore: true },
    });

    expect(output.featureFlags).toEqual({ fileCacheHeaders: true, postgresCore: true });
  });

  it('should set maintenance', async () => {
    const output = await SetMaintenanceController.handle({
      name: 'cli-write-a',
      maintenance: true,
    });

    expect(output).toMatchObject({ maintenance: true });
  });

  it('should store stats', async () => {
    const output = await UpdateStatsController.handle({ name: 'cli-write-a', stats });

    expect(output.stats).toEqual(stats);
  });

  it('should store the latest health check', async () => {
    const output = await RecordHealthCheckController.handle({ name: 'cli-write-a', healthCheck });

    expect(output.healthChecks).toEqual([healthCheck]);
  });

  it('should delete a tenant and report which one', async () => {
    expect(await DeleteTenantController.handle({ name: 'cli-write-a' })).toEqual({
      name: 'cli-write-a',
    });
    expect(await db.collection('tenants').findOne({ name: 'cli-write-a' })).toBeNull();
  });

  it('should fail when the tenant does not exist', async () => {
    await expect(
      UpdateTenantController.handle({ name: 'cli-write-new', domain: 'x' })
    ).rejects.toThrow(TenantNotFound);
    await expect(DeleteTenantController.handle({ name: 'cli-write-new' })).rejects.toThrow(
      TenantNotFound
    );
  });
});
