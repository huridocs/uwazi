import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantUseCasesFactory } from '../../infrastructure/TenantUseCasesFactory.js';
import { TenantNotFound } from '../errors.js';

const names = ['uc-tenant-a', 'uc-tenant-b', 'uc-tenant-new'];

describe('tenant registry use cases', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await testingDB.disconnect();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('tenants').insertMany([
      {
        name: 'uc-tenant-a',
        dbName: 'uc-tenant-a',
        indexName: 'uc-tenant-a',
        domain: 'a.uwazi.io',
        featureFlags: { fileCacheHeaders: true },
      },
      { name: 'uc-tenant-b', dbName: 'uc-tenant-b' },
    ]);
  });

  describe('RegisterTenant', () => {
    const sut = () => TenantUseCasesFactory.registerTenant();

    it('should derive the database, index and folder names from the tenant name', async () => {
      const result = await sut().execute({ name: 'uc-tenant-new' });

      expect(result).toEqual({
        name: 'uc-tenant-new',
        dbName: 'uc-tenant-new',
        indexName: 'uc-tenant-new',
        uploadedDocuments: 'uc-tenant-new/documents',
        attachments: 'uc-tenant-new/documents',
        customUploads: 'uc-tenant-new/custom_uploads',
        activityLogs: 'uc-tenant-new/log',
      });
    });

    it('should keep the values it was given', async () => {
      const result = await sut().execute({
        name: 'uc-tenant-new',
        dbName: 'other_db',
        domain: 'new.uwazi.io',
        featureFlags: { postgresCore: true },
      });

      expect(result).toMatchObject({
        dbName: 'other_db',
        indexName: 'uc-tenant-new',
        domain: 'new.uwazi.io',
        featureFlags: { postgresCore: true },
      });
    });

    it('should be idempotent, updating a tenant that already exists', async () => {
      await sut().execute({ name: 'uc-tenant-a', domain: 'changed.uwazi.io' });
      const result = await sut().execute({ name: 'uc-tenant-a', domain: 'changed.uwazi.io' });

      expect(result).toMatchObject({ domain: 'changed.uwazi.io' });
      expect(result.featureFlags).toEqual({ fileCacheHeaders: true });
      expect(await db.collection('tenants').countDocuments({ name: 'uc-tenant-a' })).toBe(1);
    });
  });

  describe('UpdateTenant', () => {
    const sut = () => TenantUseCasesFactory.updateTenant();

    it('should change only the fields sent', async () => {
      const result = await sut().execute({ name: 'uc-tenant-a', domain: 'changed.uwazi.io' });

      expect(result).toMatchObject({ domain: 'changed.uwazi.io', dbName: 'uc-tenant-a' });
    });

    it('should remove a field sent as null', async () => {
      const result = await sut().execute({ name: 'uc-tenant-a', domain: null });

      expect(result).not.toHaveProperty('domain');
    });

    it('should fail when there is no such tenant', async () => {
      await expect(
        sut().execute({ name: 'uc-tenant-new', domain: 'nope.uwazi.io' })
      ).rejects.toThrow(TenantNotFound);
    });
  });

  describe('ListTenants', () => {
    it('should return every tenant sorted by name', async () => {
      const result = (await TenantUseCasesFactory.listTenants().execute()).filter(tenant =>
        names.includes(tenant.name)
      );

      expect(result.map(tenant => tenant.name)).toEqual(['uc-tenant-a', 'uc-tenant-b']);
    });
  });

  describe('GetTenant', () => {
    const sut = () => TenantUseCasesFactory.getTenant();

    it('should return the tenant', async () => {
      expect(await sut().execute('uc-tenant-b')).toEqual({
        name: 'uc-tenant-b',
        dbName: 'uc-tenant-b',
      });
    });

    it('should fail when there is no such tenant', async () => {
      await expect(sut().execute('uc-tenant-new')).rejects.toThrow(TenantNotFound);
    });
  });

  describe('DeregisterTenant', () => {
    const sut = () => TenantUseCasesFactory.deregisterTenant();

    it('should remove the tenant from the registry', async () => {
      await sut().execute('uc-tenant-a');

      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-a' })).toBeNull();
    });

    it('should fail when there is no such tenant', async () => {
      await expect(sut().execute('uc-tenant-new')).rejects.toThrow(TenantNotFound);
    });
  });
});
