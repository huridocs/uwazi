import mongoose from 'mongoose';
import { Db } from 'mongodb';
import { tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import { testingTenants } from 'api/utils/testingTenants';
import { instanceModel } from 'api/odm';
import testingDB from 'api/utils/testing_db';
import { DB } from '../DB';

const testSchema = new mongoose.Schema({
  name: String,
  value: String,
});
interface TestDoc {
  name: string;
  value?: string;
}

describe('ODM Model multi-tenant', () => {
  let db1: Db;
  let db2: Db;
  let defaultDB: Db;

  beforeAll(async () => {
    await testingDB.connect({ defaultTenant: false });
    defaultDB = DB.connectionForDB(config.defaultTenant.dbName).db;
    db1 = DB.connectionForDB('db1').db;
    db2 = DB.connectionForDB('db2').db;
  });

  beforeEach(async () => {
    await db1.collection('docs').deleteMany({});
    await db2.collection('docs').deleteMany({});
  });

  afterAll(async () => {
    await defaultDB.dropDatabase();
    await db1.dropDatabase();
    await db2.dropDatabase();
    await testingDB.disconnect();
  });

  const instanceTestingModel = () => {
    const testingModel = instanceModel<TestDoc>('docs', testSchema);
    tenants.add(
      testingTenants.createTenant({ name: 'tenant1', dbName: 'db1', indexName: 'index1' })
    );
    tenants.add(
      testingTenants.createTenant({ name: 'tenant2', dbName: 'db2', indexName: 'index2' })
    );
    return testingModel;
  };

  describe('when no tenant passed on run context', () => {
    it('should run context with default tenant', async () => {
      const testingModel = instanceTestingModel();

      await tenants.run(async () => {
        await testingModel.save({
          name: 'document on default db',
        });
      });

      const results = await defaultDB.collection('docs').find().toArray();

      expect(results).toEqual([expect.objectContaining({ name: 'document on default db' })]);
    });
  });

  describe('when not tenant found on current async context', () => {
    it('should throw an error', async () => {
      const testingModel = instanceTestingModel();
      await expect(testingModel.save({ name: 'doc' })).rejects.toBeInstanceOf(Error);
    });
  });

  describe('when tenant does not exists', () => {
    it('should throw an error', async () => {
      const testingModel = instanceTestingModel();
      await expect(
        tenants.run(async () => {
          await testingModel.save({ name: 'document 1' });
        }, 'non-existent-tenant')
      ).rejects.toEqual(
        new Error(
          'the tenant set to run the current async context -> [non-existent-tenant] its not available in the current process'
        )
      );
    });
  });

  describe('save', () => {
    it('should save to diferent dbs based on tenant on the context', async () => {
      const testingModel = instanceTestingModel();

      await tenants.run(async () => {
        await testingModel.save({
          name: 'document 1',
        });
      }, 'tenant1');

      await tenants.run(async () => {
        await testingModel.save({
          name: 'document 2',
        });
      }, 'tenant2');

      const results1 = await db1.collection('docs').find().toArray();

      const results2 = await db2.collection('docs').find().toArray();

      expect(results1).toEqual([expect.objectContaining({ name: 'document 1' })]);
      expect(results2).toEqual([expect.objectContaining({ name: 'document 2' })]);
    });
  });

  describe('get', () => {
    it('should get results from diferent dbs based on tenant context', async () => {
      const testingModel = instanceTestingModel();

      await db1.collection('docs').insertMany([{ name: 'db1-doc1' }, { name: 'db1-doc2' }]);
      await db2.collection('docs').insertMany([{ name: 'db2-doc1' }]);

      await tenants.run(async () => {
        const results = await testingModel.get();
        expect(results).toEqual([
          expect.objectContaining({ name: 'db1-doc1' }),
          expect.objectContaining({ name: 'db1-doc2' }),
        ]);
      }, 'tenant1');

      await tenants.run(async () => {
        const results = await testingModel.get();
        expect(results).toEqual([expect.objectContaining({ name: 'db2-doc1' })]);
      }, 'tenant2');
    });
  });

  describe('getById', () => {
    it('should get result from diferent dbs based on tenant context', async () => {
      const testingModel = instanceTestingModel();

      const db1doc2Id = testingDB.id();
      await db1.collection('docs').insertMany([
        { _id: testingDB.id(), name: 'db1-doc1' },
        { _id: db1doc2Id, name: 'db1-doc2' },
      ]);

      const db2doc1Id = testingDB.id();
      await db2.collection('docs').insertMany([{ _id: db2doc1Id, name: 'db2-doc1' }]);

      await tenants.run(async () => {
        const doc = await testingModel.getById(db1doc2Id);
        expect(doc).toEqual(expect.objectContaining({ name: 'db1-doc2' }));
      }, 'tenant1');

      await tenants.run(async () => {
        const doc = await testingModel.getById(db2doc1Id);
        expect(doc).toEqual(expect.objectContaining({ name: 'db2-doc1' }));
      }, 'tenant2');
    });
  });

  describe('delete', () => {
    it('should delete from diferent dbs based on tenant context', async () => {
      const testingModel = instanceTestingModel();

      await db1.collection('docs').insertMany([{ name: 'db1-doc1' }, { name: 'db1-doc2' }]);
      await db2.collection('docs').insertMany([{ name: 'db2-doc1' }, { name: 'db2-doc1' }]);

      await tenants.run(async () => {
        await testingModel.delete({ name: 'db1-doc1' });
      }, 'tenant1');

      const results1 = await db1.collection('docs').find().toArray();

      expect(results1).toEqual([expect.objectContaining({ name: 'db1-doc2' })]);

      await tenants.run(async () => {
        await testingModel.delete({});
      }, 'tenant2');

      const results2 = await db2.collection('docs').find().toArray();

      expect(results2).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count from diferent dbs based on tenant context', async () => {
      const testingModel = instanceTestingModel();

      await db1.collection('docs').insertMany([{ name: 'db1-doc1' }, { name: 'db1-doc2' }]);
      await db2.collection('docs').insertMany([{ name: 'db2-doc1' }]);

      await tenants.run(async () => {
        expect(await testingModel.count()).toBe(2);
      }, 'tenant1');

      await tenants.run(async () => {
        expect(await testingModel.count()).toBe(1);
      }, 'tenant2');
    });
  });

  describe('Logging functionality', () => {
    const originalDatenow = Date.now;
    Date.now = () => 1;
    beforeEach(async () => {
      const testingModel = instanceTestingModel();

      await tenants.run(async () => {
        await testingModel.save({ name: 'document 1' });
      }, 'tenant1');

      await tenants.run(async () => {
        await testingModel.save({ name: 'document 2' });
      }, 'tenant2');

      Date.now = originalDatenow;
    });

    it('should create a log entry when saving on diferent tenants', async () => {
      const [logEntry1] = await db1.collection('updatelogs').find().toArray();

      const [logEntry2] = await db2.collection('updatelogs').find().toArray();

      expect(logEntry1.timestamp).toBe(1);
      expect(logEntry1.namespace).toBe('docs');
      expect(logEntry2.timestamp).toBe(1);
      expect(logEntry2.namespace).toBe('docs');
    });
  });
});
