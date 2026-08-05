/* eslint-disable max-classes-per-file */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresDataSource } from '../PostgresDataSource.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import type { PostgresDataSourceDeps } from '../PostgresDataSource.js';

type TestRow = {
  _id: string;
  name: string;
};

class TestDataSource extends PostgresDataSource<TestRow> {
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager }) {
    super('thesauri', deps);
  }

  async insertRow(id: string, name: string) {
    await this.table.insert({ _id: id, name, values: JSON.stringify([]) });
  }

  async getById(id: string) {
    return this.table.where({ _id: id }).first();
  }

  async getAll() {
    return this.table.all();
  }

  async rowCount() {
    return this.table.count();
  }

  async updateRow(id: string, name: string) {
    await this.table.where({ _id: id }).update({ name });
  }

  async deleteRow(id: string) {
    await this.table.where({ _id: id }).delete();
  }
}

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId: string) =>
  new TestDataSource({
    tenantId,
    pgTransactionManager: managerFor(tenantId),
  });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['thesauri']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresDataSource', () => {
  describe('multitenancy', () => {
    it('should isolate tenant A from tenant B', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'A item');

      const rowsB = await dsB.getAll();
      expect(rowsB).toHaveLength(0);
    });

    it('should allow both tenants to have rows with the same _id', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('same-id', 'data-A');
      await dsB.insertRow('same-id', 'data-B');

      expect(await dsA.rowCount()).toBe(1);
      expect(await dsB.rowCount()).toBe(1);

      const rowA = await dsA.getById('same-id');
      const rowB = await dsB.getById('same-id');

      expect(rowA!.name).toBe('data-A');
      expect(rowB!.name).toBe('data-B');
    });

    it('should not allow tenant A to update tenant B rows', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'original-A');

      await dsB.updateRow('item-1', 'should-not-work');

      const row = await dsA.getById('item-1');
      expect(row!.name).toBe('original-A');
    });

    it('should not allow tenant A to delete tenant B rows', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'protect-me');

      await dsB.deleteRow('item-1');

      expect(await dsA.rowCount()).toBe(1);
    });

    it('should support multiple datasources from different tenants', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');
      const dsC = makeDS('tenant-c');

      await dsA.insertRow('a1', 'A data');
      await dsB.insertRow('b1', 'B data');
      await dsC.insertRow('c1', 'C data');

      expect(await dsA.rowCount()).toBe(1);
      expect(await dsB.rowCount()).toBe(1);
      expect(await dsC.rowCount()).toBe(1);
    });

    it('should isolate findAll results per tenant', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('a1', 'A1');
      await dsA.insertRow('a2', 'A2');
      await dsB.insertRow('b1', 'B1');

      const aRows = await dsA.getAll();
      expect(aRows).toHaveLength(2);
      expect(aRows.every((r: TestRow) => r.name.startsWith('A'))).toBe(true);

      const bRows = await dsB.getAll();
      expect(bRows).toHaveLength(1);
      expect(bRows[0].name).toBe('B1');
    });
  });

  describe('syncWriter wiring', () => {
    const SYNC_NS = 'ds_test_thesauri';

    class SyncedTestDataSource extends PostgresDataSource<TestRow> {
      constructor(deps: PostgresDataSourceDeps) {
        super('thesauri', deps);
      }

      async insertRow(id: string, name: string) {
        await this.table.insert({ _id: id, name, values: JSON.stringify([]) });
      }

      async deleteRow(id: string) {
        await this.table.where({ _id: id }).delete();
      }
    }

    const makeSyncedDS = (tenantId: string) => {
      const syncDb = getConnection();
      return new SyncedTestDataSource({
        tenantId,
        pgTransactionManager: managerFor(tenantId),
        sync: { syncDb, syncNamespace: SYNC_NS },
      });
    };

    beforeEach(async () => {
      await getConnection().collection('updatelogs').deleteMany({});
    });

    it('should write sync logs through the wired SyncLogWriter', async () => {
      const ds = makeSyncedDS('tenant-a');
      const id = new ObjectId().toHexString();

      await ds.insertRow(id, 'synced');

      const logs = await getConnection().collection('updatelogs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].namespace).toBe(SYNC_NS);
      expect(logs[0].mongoId.toString()).toBe(id);
      expect(logs[0].deleted).toBe(false);
    });

    it('should write deleted sync logs', async () => {
      const ds = makeSyncedDS('tenant-a');
      const id = new ObjectId().toHexString();
      await ds.insertRow(id, 'to-delete');
      await getConnection().collection('updatelogs').deleteMany({});

      await ds.deleteRow(id);

      const logs = await getConnection().collection('updatelogs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(id);
      expect(logs[0].deleted).toBe(true);
    });

    it('should not write sync logs when sync options are not provided', async () => {
      const ds = new SyncedTestDataSource({
        tenantId: 'tenant-a',
        pgTransactionManager: managerFor('tenant-a'),
      });
      const id = new ObjectId().toHexString();

      await ds.insertRow(id, 'no-log');

      const logs = await getConnection().collection('updatelogs').find({}).toArray();
      expect(logs).toHaveLength(0);
    });
  });
});
