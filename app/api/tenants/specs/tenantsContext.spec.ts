import { DB } from 'api/odm/DB';
import { Db } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { config } from 'api/config';
import { tenants } from '../tenantContext';
import { tenantsModel } from '../tenantsModel';

describe('tenantsContext', () => {
  describe('add', () => {
    it('should add defaults to tenant added', async () => {
      tenants.add({ name: 'test-tenant', dbName: 'test-tenant-db' });
      await tenants.run(async () => {
        expect(tenants.current()).toMatchObject({
          ...config.defaultTenant,
          name: 'test-tenant',
          dbName: 'test-tenant-db',
        });
      }, 'test-tenant');
    });
  });

  describe('updateTenants', () => {
    let db: Db;

    beforeAll(async () => {
      await testingDB.connect();
      testingEnvironment.setRequestId();
      db = DB.connectionForDB(config.SHARED_DB).db;

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
      await db.collection('tenants').deleteMany({});
      await testingEnvironment.tearDown();
    });

    it('should udpate tenants with DB data', async () => {
      await tenants.updateTenants(await tenantsModel());

      expect(tenants.tenants['tenant one'].dbName).toBe('tenant_one');
      expect(tenants.tenants['tenant two'].dbName).toBe('tenant_two');
    });
  });
});
