import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantUseCasesFactory } from '../../infrastructure/TenantUseCasesFactory.js';
import { TenantNotFound } from '../errors.js';

const names = ['op-tenant-a', 'op-tenant-missing'];

const healthCheck = {
  name: 'disk',
  lastUpdated: 1700000000,
  warnings: ['almost full'],
  problems: [],
  summary: { used: 90 },
};

const stats = {
  lastUpdated: 1700000000,
  dbStorage: 1,
  elasticStorage: 2,
  filesStorage: 3,
  entitiesCount: 4,
  filesCount: 5,
  totalStorage: 6,
  filesByBucket: { pdf: { count: 3, size: 1200 }, image: { count: 2, size: 800 } },
  userCount: { admin: 1, editor: 2, collaborator: 3, total: 6 },
  lastSession: 1700000000,
};

describe('tenant operational use cases', () => {
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
      name: 'op-tenant-a',
      dbName: 'op-tenant-a',
      featureFlags: { fileCacheHeaders: true, telemetry: { enabled: true, sampleRate: 0.5 } },
    });
  });

  describe('SetTenantFeatureFlags', () => {
    const sut = () => TenantUseCasesFactory.setTenantFeatureFlags();

    it('should merge, leaving the flags it was not sent alone', async () => {
      const result = await sut().execute({
        name: 'op-tenant-a',
        featureFlags: { postgresCore: true },
      });

      expect(result.featureFlags).toEqual({
        fileCacheHeaders: true,
        postgresCore: true,
        telemetry: { enabled: true, sampleRate: 0.5 },
      });
    });

    it('should remove a flag sent as null', async () => {
      const result = await sut().execute({
        name: 'op-tenant-a',
        featureFlags: { fileCacheHeaders: null },
      });

      expect(result.featureFlags).toEqual({ telemetry: { enabled: true, sampleRate: 0.5 } });
    });

    it('should remove one flag of a group without touching its siblings', async () => {
      const result = await sut().execute({
        name: 'op-tenant-a',
        featureFlags: { telemetry: { enabled: null } },
      });

      expect(result.featureFlags?.telemetry).toEqual({ sampleRate: 0.5 });
    });

    it('should fail when there is no such tenant', async () => {
      await expect(
        sut().execute({ name: 'op-tenant-missing', featureFlags: { postgresCore: true } })
      ).rejects.toThrow(TenantNotFound);
    });
  });

  describe('SetTenantMaintenance', () => {
    const sut = () => TenantUseCasesFactory.setTenantMaintenance();

    it('should put the tenant under maintenance and take it out again', async () => {
      expect(await sut().execute({ name: 'op-tenant-a', maintenance: true })).toMatchObject({
        maintenance: true,
      });
      expect(await sut().execute({ name: 'op-tenant-a', maintenance: false })).toMatchObject({
        maintenance: false,
      });
    });

    it('should fail when there is no such tenant', async () => {
      await expect(sut().execute({ name: 'op-tenant-missing', maintenance: true })).rejects.toThrow(
        TenantNotFound
      );
    });
  });

  describe('UpdateTenantStats', () => {
    const sut = () => TenantUseCasesFactory.updateTenantStats();

    it('should store the stats as sent', async () => {
      const result = await sut().execute({ name: 'op-tenant-a', stats });

      expect(result.stats).toEqual(stats);
    });

    it('should replace stats stored before', async () => {
      await sut().execute({ name: 'op-tenant-a', stats });
      const result = await sut().execute({
        name: 'op-tenant-a',
        stats: { ...stats, entitiesCount: 99 },
      });

      expect(result.stats).toEqual({ ...stats, entitiesCount: 99 });
    });

    it('should fail when there is no such tenant', async () => {
      await expect(sut().execute({ name: 'op-tenant-missing', stats })).rejects.toThrow(
        TenantNotFound
      );
    });
  });

  describe('RecordTenantHealthCheck', () => {
    const sut = () => TenantUseCasesFactory.recordTenantHealthCheck();

    it('should store the health check as the only one', async () => {
      await sut().execute({ name: 'op-tenant-a', healthCheck });
      const result = await sut().execute({
        name: 'op-tenant-a',
        healthCheck: { ...healthCheck, warnings: [] },
      });

      expect(result.healthChecks).toEqual([{ ...healthCheck, warnings: [] }]);
    });

    it('should fail when there is no such tenant', async () => {
      await expect(sut().execute({ name: 'op-tenant-missing', healthCheck })).rejects.toThrow(
        TenantNotFound
      );
    });
  });

  describe('UpdateTenant with metadata', () => {
    it('should store the metadata the manager keeps next to the registry', async () => {
      const metadata = { orgName: 'Acme', adminEmail: 'a@acme.org', status: 'active' as const };

      const result = await TenantUseCasesFactory.updateTenant().execute({
        name: 'op-tenant-a',
        metadata,
      });

      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('the fields uwazi stores but never reads', () => {
    it('should keep them out of the running process', async () => {
      await TenantUseCasesFactory.updateTenantStats().execute({ name: 'op-tenant-a', stats });
      const { tenantsModel } = await import('../../tenantsModel.js');
      const model = await tenantsModel();

      const loaded = (await model.get()).find(tenant => tenant.name === 'op-tenant-a');

      expect(loaded).not.toHaveProperty('stats');
      expect(loaded).not.toHaveProperty('healthChecks');
    });
  });
});
