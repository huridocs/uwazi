import { Db } from 'mongodb';
import { appContext } from '#api/utils/AppContext.js';
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
      jest.spyOn(appContext, 'get').mockRestore();
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

  it('should merge telemetry config with the default when only partially overridden', async () => {
    tenants.add({
      name: 'test-tenant-telemetry',
      dbName: 'test-tenant-telemetry-db',
      telemetry: { enabled: true },
    });

    await tenants.run(async () => {
      expect(tenants.current().telemetry).toEqual({
        enabled: true,
        thresholdMs: config.defaultTenant.telemetry!.thresholdMs,
      });
    }, 'test-tenant-telemetry');
  });

  it('should default telemetry to disabled when not set on the tenant', async () => {
    tenants.add({
      name: 'test-tenant-no-telemetry',
      dbName: 'test-tenant-no-telemetry-db',
    });

    await tenants.run(async () => {
      expect(tenants.current().telemetry).toEqual(config.defaultTenant.telemetry);
    }, 'test-tenant-no-telemetry');
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
