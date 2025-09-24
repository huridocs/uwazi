import { Db } from 'mongodb';
import mongoose from 'mongoose';
import waitForExpect from 'wait-for-expect';
// @ts-expect-error TS(2307): Cannot find module '../tenants/tenantContext.js' o... Remove this comment to see the full error message
import { tenants } from '../tenants/tenantContext.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/testingTenants.js' or... Remove this comment to see the full error message
import { testingTenants } from '../utils/testingTenants.js';

// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
import { config } from '../config.js';
import { DB } from '../DB.js';
import { instanceModel } from '../model.js';

import testingDB from 'api/utils/testing_db.js';

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

  beforeEach(async () => {
    const uri = config.DBHOST;
    await DB.connect(`${uri}_DB_spec_ts`);
    db1 = testingDB.db('db1');
    db2 = testingDB.db('db2');
  });

  afterAll(async () => {
    await db1.dropDatabase();
    await db2.dropDatabase();
    await DB.disconnect();
  });

  describe('newDB', () => {
    it('should not instantiate new connections for same dbName by default', () => {
      const dbConnection = DB.connectionForDB('newDB');
      expect(dbConnection).toBe(DB.connectionForDB('newDB'));
    });
  });

  describe('ensureIndexes', () => {
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
        await model.db.ensureIndexes();
      }, 'tenant1');

      await tenants.run(async () => {
        await model.db.ensureIndexes();
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

      updatedSchema.index({ value: 1 });
      updatedSchema.index({ text: 'text' });
      const model = instanceModel<TestDoc>('docs', updatedSchema);

      await tenants.run(async () => {
        await model.db.ensureIndexes();
      }, 'tenant1');

      await tenants.run(async () => {
        await model.db.ensureIndexes();
      }, 'tenant2');

      const expected = ['_id_', 'name_1', 'value_1', 'text_text'];

      await waitForExpect(async () => {
        expect(Object.keys(await db1.collection('docs').indexInformation())).toEqual(expected);
        expect(Object.keys(await db2.collection('docs').indexInformation())).toEqual(expected);
      });
    });
  });
});
