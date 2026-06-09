import { ObjectId } from 'mongodb';
import { Db } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SyncedPostgresTable } from '../SyncedPostgresTable.js';

type TestRow = {
  _id: string;
  name: string;
  values: Record<string, unknown>[];
  tenant_id: string;
};

const DEFAULT_TENANT = 'tenant-a';
const NAMESPACE = 'test_thesauri';

const createTable = (tenantId = DEFAULT_TENANT, db: Db = getConnection()) =>
  new SyncedPostgresTable(testingPG.config, 'thesauri', tenantId, db, NAMESPACE);

const jsonVal = (v: unknown) => JSON.stringify(v);

const getLogs = () => getConnection().collection('updatelogs').find({}).toArray();

const id = () => new ObjectId().toHexString();

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['thesauri']);
  await getConnection().collection('updatelogs').deleteMany({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('SyncedPostgresTable', () => {
  describe('insert', () => {
    it('should write a sync log after insert', async () => {
      const table = createTable();
      const _id = id();

      await table.insert({ _id, name: 'alpha', values: jsonVal([]) });

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].namespace).toBe(NAMESPACE);
      expect(logs[0].mongoId.toString()).toBe(_id);
      expect(logs[0].deleted).toBe(false);
    });
  });

  describe('insertMany', () => {
    it('should write sync logs for every inserted row', async () => {
      const table = createTable();
      const m1 = id();
      const m2 = id();

      await table.insertMany([
        { _id: m1, name: 'a', values: jsonVal([]) },
        { _id: m2, name: 'b', values: jsonVal([]) },
      ]);

      const logs = await getLogs();
      expect(logs).toHaveLength(2);
      const ids = logs.map(l => l.mongoId.toString()).sort();
      expect(ids).toEqual([m1, m2].sort());
    });
  });

  describe('upsert', () => {
    it('should write a sync log on insert path of upsert', async () => {
      const table = createTable();
      const u1 = id();

      await table.upsert({ _id: u1, name: 'ups', values: jsonVal([]) }, ['_id', 'tenant_id']);

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(u1);
    });

    it('should upsert the same sync log on update path (no duplicate entries)', async () => {
      const table = createTable();
      const u2 = id();

      await table.insert({ _id: u2, name: 'first', values: jsonVal([]) });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.upsert({ _id: u2, name: 'second', values: jsonVal([]) }, ['_id', 'tenant_id']);

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(u2);
      expect(logs[0].deleted).toBe(false);
    });
  });

  describe('update', () => {
    it('should upsert sync logs for every affected row', async () => {
      const table = createTable();
      const i1 = id();
      const i2 = id();
      await table.insert({ _id: i1, name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: i2, name: 'beta', values: jsonVal([]) });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.update<TestRow>(
        { _id: { $in: [i1, i2] } },
        { values: jsonVal([{ id: 'v1', label: 'Updated' }]) }
      );

      const logs = await getLogs();
      expect(logs).toHaveLength(2);
      const ids = logs.map(l => l.mongoId.toString()).sort();
      expect(ids).toEqual([i1, i2].sort());
      expect(logs.every(l => l.deleted === false)).toBe(true);
    });

    it('should not write sync logs when nothing is updated', async () => {
      const table = createTable();
      const i3 = id();
      await table.insert({ _id: i3, name: 'only', values: jsonVal([]) });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.update<TestRow>({ name: 'nonexistent' }, { name: 'x' });

      const logs = await getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should update an existing sync log (upsert) instead of creating a duplicate', async () => {
      const table = createTable();
      const i4 = id();
      await table.insert({ _id: i4, name: 'orig', values: jsonVal([]) });
      // insert already wrote a log; update should upsert the same one
      await table.update<TestRow>({ _id: i4 }, { name: 'new' });

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(i4);
      expect(logs[0].deleted).toBe(false);
    });
  });

  describe('delete', () => {
    it('should write sync logs with deleted=true for affected rows', async () => {
      const table = createTable();
      const d1 = id();
      await table.insert({ _id: d1, name: 'gone', values: jsonVal([]) });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.delete<TestRow>({ _id: d1 });

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(d1);
      expect(logs[0].deleted).toBe(true);
    });

    it('should not write sync logs when nothing is deleted', async () => {
      const table = createTable();
      const d2 = id();
      await table.insert({ _id: d2, name: 'stay', values: jsonVal([]) });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.delete<TestRow>({ _id: '000000000000000000000000' });

      const logs = await getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should update an existing sync log to deleted=true when deleting a previously updated row', async () => {
      const table = createTable();
      const d3 = id();
      await table.insert({ _id: d3, name: 'temp', values: jsonVal([]) });
      await table.update<TestRow>({ _id: d3 }, { name: 'changed' });
      await getConnection().collection('updatelogs').deleteMany({});

      await table.delete<TestRow>({ _id: d3 });

      const logs = await getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].mongoId.toString()).toBe(d3);
      expect(logs[0].deleted).toBe(true);
    });
  });

  describe('tenant isolation', () => {
    it('should not leak sync logs across tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');
      const idA = id();
      const idB = id();

      await tableA.insert({ _id: idA, name: 'A', values: jsonVal([]) });
      await tableB.insert({ _id: idB, name: 'B', values: jsonVal([]) });

      const logs = await getLogs();
      expect(logs).toHaveLength(2);
      const ids = logs.map(l => l.mongoId.toString()).sort();
      expect(ids).toEqual([idA, idB].sort());
    });
  });
});
