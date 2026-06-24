import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { config } from '#api/config.js';
import { tenants } from '../tenantContext.js';
import { tenantsModel } from '../tenantsModel.js';

describe('tenantsContext', () => {
  describe('add', () => {
    it('should add defaults to tenant added', async () => {
      tenants.add({
        name: 'test-tenant',
        dbName: 'test-tenant-db',
        featureFlags: { themeCustomization: true },
      });
      await tenants.run(async () => {
        expect(tenants.current()).toMatchObject({
          ...config.defaultTenant,
          name: 'test-tenant',
          dbName: 'test-tenant-db',
          featureFlags: {
            ...config.defaultTenant.featureFlags,
            themeCustomization: true,
          },
        });
      }, 'test-tenant');
    });

    it('should keep DATABASE_NAME env for the default tenant', () => {
      const previousDatabaseName = process.env.DATABASE_NAME;
      const previousIndexName = process.env.INDEX_NAME;
      const previousPort = process.env.PORT;

      process.env.DATABASE_NAME = 'uwazi_development_3000';
      process.env.INDEX_NAME = 'uwazi_development_3000';
      process.env.PORT = '3000';

      tenants.add({
        name: config.defaultTenant.name,
        dbName: 'uwazi_development_3002',
        indexName: 'uwazi_development_3002',
        domain: 'stale-host:3002',
      });

      expect(tenants.tenants[config.defaultTenant.name]).toMatchObject({
        dbName: 'uwazi_development_3000',
        indexName: 'uwazi_development_3000',
        domain: expect.stringContaining(':3000'),
      });

      if (previousDatabaseName === undefined) {
        delete process.env.DATABASE_NAME;
      } else {
        process.env.DATABASE_NAME = previousDatabaseName;
      }
      if (previousIndexName === undefined) {
        delete process.env.INDEX_NAME;
      } else {
        process.env.INDEX_NAME = previousIndexName;
      }
      if (previousPort === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = previousPort;
      }
    });
  });

  describe('updateTenants', () => {
    let db: Db;

    beforeAll(async () => {
      await testingDB.connect();
      testingEnvironment.setRequestId();
      db = testingDB.db(config.SHARED_DB);

      await db.collection('tenants').deleteMany({});
      await db.collection('tenants').insertMany([
        {
          name: 'tenant one',
          dbName: 'tenant_one',
        },
        {
          name: 'tenant two',
          dbName: 'tenant_two',
        },
      ]);
    });

    afterAll(async () => {
      // await for the debounce to finish
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
      await tenants.tearDownTenants();
      await db.collection('tenants').deleteMany({});
      await testingEnvironment.tearDown();
    });

    it('should udpate tenants with DB data', async () => {
      const model = await tenantsModel();
      await model.initialize();
      await tenants.updateTenants(model);

      expect(tenants.tenants['tenant one'].dbName).toBe('tenant_one');
      expect(tenants.tenants['tenant two'].dbName).toBe('tenant_two');
      await model.closeChangeStream();
    });
  });

  it('should only return tenants enabled for given feature flag', () => {
    tenants.add({
      name: 'test-tenant',
      dbName: 'test-tenant-db',
      featureFlags: { s3Storage: true },
    });

    tenants.add({
      name: 'test-tenant-2',
      dbName: 'test-tenant-db',
      featureFlags: { s3Storage: false },
    });

    const result = tenants.getTenantsForFeatureFlag('s3Storage');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('test-tenant');
    expect(result[0].featureFlags?.s3Storage).toBeTruthy();
  });
});
