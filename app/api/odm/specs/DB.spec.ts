import { Db } from 'mongodb';
import mongoose from 'mongoose';
import waitForExpect from 'wait-for-expect';
import { tenants } from 'api/odm/tenantContext';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { testingTenants } from 'api/utils/testingTenants';

import { DB } from '../DB';
import { instanceModel } from '../model';

const testSchema = new mongoose.Schema({
  name: { type: String, index: true },
  value: String,
  text: String,
});

interface TestDoc {
  name: string;
  value?: string;
  text?: string;
}

describe('DB', () => {
  let db1: Db;
  let db2: Db;
  let mongod: MongoMemoryServer;
  let mongoUri: string;

  beforeAll(async () => {
    mongod = new MongoMemoryServer();
    mongoUri = await mongod.getUri();
  });

  beforeEach(async () => {
    await DB.connect(mongoUri);
    // mongo/mongoose types collisions
    // @ts-ignore
    db1 = DB.getConnection().useDb('db1').db;
    // @ts-ignore
    db2 = DB.getConnection().useDb('db2').db;
  });

  afterEach(async () => {
    await DB.disconnect();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  describe('newDB', () => {
    it('should not instantiate new connections for same dbName', () => {
      const dbConnection = DB.connectionForDB('newDB');
      expect(dbConnection).toBe(DB.connectionForDB('newDB'));
    });
  });

  describe('instance', () => {
    it('should create indexes', async () => {
      const model = instanceModel<TestDoc>('docs', testSchema);
      tenants.add(
        testingTenants.createTenant({ name: 'tenant1', dbName: 'db1', indexName: 'index' })
      );
      tenants.add(
        testingTenants.createTenant({ name: 'tenant2', dbName: 'db2', indexName: 'index' })
      );

      const expected = ['_id_', 'name_1'];

      await tenants.run(async () => {
        model.db.dbForCurrentTenant();
      }, 'tenant1');

      await tenants.run(async () => {
        model.db.dbForCurrentTenant();
      }, 'tenant2');

      await waitForExpect(async () => {
        expect(Object.keys(await db1.collection('docs').indexInformation())).toEqual(expected);
        expect(Object.keys(await db2.collection('docs').indexInformation())).toEqual(expected);
      });
    });

    it('should maintain indexes in sync', async () => {
      const updatedSchema = new mongoose.Schema({
        name: String,
        value: String,
        text: String,
      });

      updatedSchema.index('value');
      updatedSchema.index({ text: 'text' });
      const model = instanceModel<TestDoc>('docs', updatedSchema);

      await tenants.run(async () => {
        model.db.dbForCurrentTenant();
      }, 'tenant1');

      await tenants.run(async () => {
        model.db.dbForCurrentTenant();
      }, 'tenant2');

      const expected = ['_id_', 'name_1', 'value_1', 'text_text'];

      await waitForExpect(async () => {
        expect(Object.keys(await db1.collection('docs').indexInformation())).toEqual(expected);
        expect(Object.keys(await db2.collection('docs').indexInformation())).toEqual(expected);
      });
    });
  });
});
