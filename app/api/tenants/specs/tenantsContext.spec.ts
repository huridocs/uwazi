/* eslint-disable max-statements */
import { Db } from 'mongodb';
import { appContext } from '#api/utils/AppContext.js';
import testingDB from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { config } from '#api/config.js';
import { testingTenants } from '#api/utils/testingTenants.js';
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
    let model: Awaited<ReturnType<typeof tenantsModel>>;

    const defaultName = config.defaultTenant.name;

    beforeAll(async () => {
      await testingDB.connect();
      testingEnvironment.setRequestId();
      db = testingDB.db(config.SHARED_DB);
      model = await tenantsModel();
      await model.initialize();
    });

    beforeEach(async () => {
      await db.collection('tenants').deleteMany({});
      await tenants.updateTenants(model);
    });

    afterEach(async () => {
      await db.collection('tenants').deleteMany({});
      await tenants.updateTenants(model);
    });

    afterAll(async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
      await tenants.tearDownTenants();
      await db.collection('tenants').deleteMany({});
      await testingEnvironment.tearDown();
      jest.spyOn(appContext, 'get').mockRestore();
    });

    it('keeps the constructor seed when the tenants collection is empty', async () => {
      await tenants.updateTenants(model);

      expect(Object.keys(tenants.tenants)).toEqual([defaultName]);
      expect(tenants.tenants[defaultName].dbName).toBe(config.defaultTenant.dbName);
    });

    it('replaces the in-memory map with Mongo tenants and drops the seeded default', async () => {
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
      await tenants.updateTenants(model);

      expect(Object.keys(tenants.tenants).sort()).toEqual(['tenant one', 'tenant two']);
      expect(tenants.tenants[defaultName]).toBeUndefined();
      expect(tenants.tenants['tenant one'].dbName).toBe('tenant_one');
      expect(tenants.tenants['tenant two'].dbName).toBe('tenant_two');
    });

    it('still resolves current() for the default context when the seed is not in the map', async () => {
      testingTenants.restoreCurrentFn();
      jest.spyOn(appContext, 'get').mockRestore();

      await db.collection('tenants').insertOne({ name: 'tenant one', dbName: 'tenant_one' });
      await tenants.updateTenants(model);
      expect(tenants.tenants[defaultName]).toBeUndefined();

      await tenants.run(async () => {
        expect(tenants.current()).toBe(tenants.defaultTenant);
      }, defaultName);

      await expect(
        tenants.run(async () => {
          tenants.current();
        }, 'missing-tenant')
      ).rejects.toThrow(
        'the tenant set to run the current async context -> [missing-tenant] its not available in the current process'
      );
    });

    it('uses the Mongo default row when the collection includes one', async () => {
      testingTenants.restoreCurrentFn();
      jest.spyOn(appContext, 'get').mockRestore();

      await db.collection('tenants').insertMany([
        {
          name: defaultName,
          dbName: 'mongo_default_db',
        },
        {
          name: 'other',
          dbName: 'other_db',
        },
      ]);
      await tenants.updateTenants(model);

      expect(Object.keys(tenants.tenants).sort()).toEqual([defaultName, 'other'].sort());
      expect(tenants.tenants[defaultName].dbName).toBe('mongo_default_db');
      expect(tenants.tenants[defaultName].dbName).not.toBe(config.defaultTenant.dbName);

      await tenants.run(async () => {
        expect(tenants.current()).toBe(tenants.tenants[defaultName]);
        expect(tenants.current().dbName).toBe('mongo_default_db');
      }, defaultName);
    });

    it('falls back to the constructor seed when Mongo tenants are later emptied', async () => {
      await db.collection('tenants').insertOne({ name: 'tenant one', dbName: 'tenant_one' });
      await tenants.updateTenants(model);
      expect(tenants.tenants[defaultName]).toBeUndefined();

      await db.collection('tenants').deleteMany({});
      await tenants.updateTenants(model);

      expect(Object.keys(tenants.tenants)).toEqual([defaultName]);
      expect(tenants.tenants[defaultName].dbName).toBe(config.defaultTenant.dbName);
    });
  });

  it('should merge telemetry config with the default when only partially overridden', async () => {
    tenants.add({
      name: 'test-tenant-telemetry',
      dbName: 'test-tenant-telemetry-db',
      featureFlags: { telemetry: { enabled: true } },
    });

    await tenants.run(async () => {
      expect(tenants.current().featureFlags?.telemetry).toEqual({
        enabled: true,
        sampleRate: config.defaultTenant.featureFlags!.telemetry!.sampleRate,
      });
    }, 'test-tenant-telemetry');
  });

  it('should default telemetry to disabled when not set on the tenant', async () => {
    tenants.add({
      name: 'test-tenant-no-telemetry',
      dbName: 'test-tenant-no-telemetry-db',
    });

    await tenants.run(async () => {
      expect(tenants.current().featureFlags?.telemetry).toEqual(
        config.defaultTenant.featureFlags!.telemetry
      );
    }, 'test-tenant-no-telemetry');
  });

  it('should merge prometheus config with the default when only partially overridden', async () => {
    tenants.add({
      name: 'test-tenant-prometheus',
      dbName: 'test-tenant-prometheus-db',
      featureFlags: { prometheus: { enabled: true } },
    });

    await tenants.run(async () => {
      expect(tenants.current().featureFlags?.prometheus).toEqual({
        enabled: true,
        sampleRate: config.defaultTenant.featureFlags!.prometheus!.sampleRate,
      });
    }, 'test-tenant-prometheus');
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

  it('should inherit feature flag defaults when unset on the tenant', async () => {
    const featureFlag = 'themeCustomization' as const;

    tenants.add({
      name: 'test-tenant-flag-default',
      dbName: 'test-tenant-flag-default-db',
    });

    await tenants.run(async () => {
      expect(tenants.current().featureFlags?.[featureFlag]).toBe(
        config.defaultTenant.featureFlags![featureFlag]
      );
    }, 'test-tenant-flag-default');
  });

  it('should keep an explicit false feature flag even when the default is true', async () => {
    const featureFlag = 'themeCustomization' as const;
    const previousDefault = tenants.defaultTenant.featureFlags?.[featureFlag];

    tenants.defaultTenant.featureFlags = {
      ...tenants.defaultTenant.featureFlags,
      [featureFlag]: true,
    };

    try {
      tenants.add({
        name: 'test-tenant-flag-false',
        dbName: 'test-tenant-flag-false-db',
        featureFlags: { [featureFlag]: false },
      });

      await tenants.run(async () => {
        expect(tenants.current().featureFlags?.[featureFlag]).toBe(false);
      }, 'test-tenant-flag-false');
    } finally {
      tenants.defaultTenant.featureFlags = {
        ...tenants.defaultTenant.featureFlags,
        [featureFlag]: previousDefault,
      };
    }
  });
});
