import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantUseCasesFactory } from '../../infrastructure/TenantUseCasesFactory.js';
import { TenantNotFound } from '../errors.js';
import { TenantStorageTaken } from '../TenantStorageTaken.js';

const names = ['uc-tenant-a', 'uc-tenant-b', 'uc-tenant-custom', 'uc-tenant-new'];

describe('tenant registry use cases', () => {
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
    await db.collection('tenants').insertMany([
      {
        name: 'uc-tenant-a',
        dbName: 'uc-tenant-a',
        indexName: 'uc-tenant-a',
        domain: 'a.uwazi.io',
        featureFlags: { fileCacheHeaders: true },
      },
      { name: 'uc-tenant-b', dbName: 'uc-tenant-b' },
      {
        name: 'uc-tenant-custom',
        dbName: 'custom_db',
        indexName: 'custom_index',
        uploadedDocuments: '/data/custom/documents',
        attachments: '/data/custom/attachments',
        customUploads: '/data/custom/uploads',
        activityLogs: '/data/custom/log',
        metadata: { orgName: 'Custom', notes: 'first' },
      },
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

    it('should never overwrite a stored value with a default when registering again', async () => {
      await sut().execute({ name: 'uc-tenant-custom', domain: 'custom.uwazi.io' });

      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-custom' })).toMatchObject({
        dbName: 'custom_db',
        indexName: 'custom_index',
        uploadedDocuments: '/data/custom/documents',
        attachments: '/data/custom/attachments',
        customUploads: '/data/custom/uploads',
        activityLogs: '/data/custom/log',
        domain: 'custom.uwazi.io',
      });
    });

    it('should fill in only the defaults a stored tenant is missing', async () => {
      await sut().execute({ name: 'uc-tenant-b' });

      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-b' })).toMatchObject({
        dbName: 'uc-tenant-b',
        indexName: 'uc-tenant-b',
        uploadedDocuments: 'uc-tenant-b/documents',
        attachments: 'uc-tenant-b/documents',
        customUploads: 'uc-tenant-b/custom_uploads',
        activityLogs: 'uc-tenant-b/log',
      });
    });

    it('should refuse a database another tenant already uses', async () => {
      await expect(sut().execute({ name: 'uc-tenant-new', dbName: 'custom_db' })).rejects.toThrow(
        TenantStorageTaken
      );
      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-new' })).toBeNull();
    });

    it('should refuse an index another tenant already uses', async () => {
      await expect(
        sut().execute({ name: 'uc-tenant-new', indexName: 'custom_index' })
      ).rejects.toThrow(TenantStorageTaken);
    });

    it('should refuse a default that another tenant already uses', async () => {
      await db
        .collection('tenants')
        .updateOne({ name: 'uc-tenant-custom' }, { $set: { dbName: 'uc-tenant-new' } });

      await expect(sut().execute({ name: 'uc-tenant-new' })).rejects.toThrow(TenantStorageTaken);
    });

    it('should still replace a stored value it is explicitly given', async () => {
      await sut().execute({ name: 'uc-tenant-custom', dbName: 'moved_db' });

      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-custom' })).toMatchObject({
        dbName: 'moved_db',
        indexName: 'custom_index',
      });
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

    it.each([
      ['dbName', 'custom_db'],
      ['indexName', 'custom_index'],
    ])('should refuse a %s another tenant already uses', async (field, value) => {
      await expect(sut().execute({ name: 'uc-tenant-a', [field]: value })).rejects.toThrow(
        TenantStorageTaken
      );
      expect(await db.collection('tenants').findOne({ name: 'uc-tenant-a' })).toMatchObject({
        [field]: 'uc-tenant-a',
      });
    });

    it('should accept the database and index the tenant already has', async () => {
      const result = await sut().execute({
        name: 'uc-tenant-custom',
        dbName: 'custom_db',
        indexName: 'custom_index',
      });

      expect(result).toMatchObject({ dbName: 'custom_db', indexName: 'custom_index' });
    });

    it('should merge metadata key by key, removing only the keys sent as null', async () => {
      await sut().execute({
        name: 'uc-tenant-custom',
        metadata: { adminEmail: 'admin@custom.org', notes: null },
      });

      expect(
        (await db.collection('tenants').findOne({ name: 'uc-tenant-custom' }))?.metadata
      ).toEqual({ orgName: 'Custom', adminEmail: 'admin@custom.org' });
    });

    it('should fail when there is no such tenant', async () => {
      await expect(
        sut().execute({ name: 'uc-tenant-new', domain: 'nope.uwazi.io' })
      ).rejects.toThrow(TenantNotFound);
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
