/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTable } from '../PostgresTable.js';

const DEFAULT_TENANT = 'tenant-a';

type TestRow = {
  _id: string;
  name: string;
  values: Record<string, unknown>[];
  tenant_id: string;
};

const createTable = (tenantId = DEFAULT_TENANT) =>
  new PostgresTable(testingPG.config, 'thesauri', tenantId);

const jsonVal = (v: unknown) => JSON.stringify(v);

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['thesauri']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresTable', () => {
  describe('insert', () => {
    it('should auto-add tenant_id to the inserted row', async () => {
      const table = createTable();

      await table.insert({ _id: 'id-1', name: 'test', values: jsonVal([]) });

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        _id: 'id-1',
        name: 'test',
        tenant_id: DEFAULT_TENANT,
      });
      expect(rows[0].values).toEqual([]);
    });

    it('should allow different tenants to insert rows independently', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'id-1', name: 'A row', values: jsonVal([]) });
      await tableB.insert({ _id: 'id-2', name: 'B row', values: jsonVal([]) });

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows).toHaveLength(2);
      expect(rows.find(r => r.tenant_id === 'tenant-a')).toBeDefined();
      expect(rows.find(r => r.tenant_id === 'tenant-b')).toBeDefined();
    });
  });

  describe('insertMany', () => {
    it('should auto-add tenant_id to all inserted rows', async () => {
      const table = createTable();

      await table.insertMany([
        { _id: 'id-1', name: 'first', values: jsonVal([]) },
        { _id: 'id-2', name: 'second', values: jsonVal([]) },
      ]);

      const rows = await testingPG.getAllFrom('thesauri');
      expect(rows).toHaveLength(2);
      rows.forEach(row => {
        expect(row.tenant_id).toBe(DEFAULT_TENANT);
      });
    });
  });

  describe('findOne', () => {
    it('should return a row matching the where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'id-1', name: 'test-find', values: jsonVal([]) });

      const row = await table.findOne<TestRow>({ _id: 'id-1' });

      expect(row).toBeDefined();
      expect(row!._id).toBe('id-1');
      expect(row!.name).toBe('test-find');
    });

    it('should return undefined when no row matches', async () => {
      const table = createTable();

      const row = await table.findOne<TestRow>({ _id: 'nonexistent' });

      expect(row).toBeUndefined();
    });

    it('should enforce tenant_id filtering — cannot see rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'tenant A data', values: jsonVal([]) });

      const rowFromB = await tableB.findOne<TestRow>({ _id: 'shared-id' });

      expect(rowFromB).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all rows for the tenant when no where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'find-all-1', name: 'first', values: jsonVal([]) });
      await table.insert({ _id: 'find-all-2', name: 'second', values: jsonVal([]) });

      const rows = await table.findAll<TestRow>();

      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.tenant_id === DEFAULT_TENANT)).toBe(true);
    });

    it('should filter by where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'filter-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'filter-2', name: 'beta', values: jsonVal([]) });

      const rows = await table.findAll<TestRow>({ name: 'alpha' });

      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('filter-1');
    });

    it('should support $in operator', async () => {
      const table = createTable();
      await table.insert({ _id: 'in-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'in-2', name: 'beta', values: jsonVal([]) });
      await table.insert({ _id: 'in-3', name: 'gamma', values: jsonVal([]) });

      const rows = await table.findAll<TestRow>({ _id: { $in: ['in-1', 'in-3'] } });

      expect(rows).toHaveLength(2);
      expect(rows.map(r => r._id).sort()).toEqual(['in-1', 'in-3']);
    });

    it('should enforce tenant_id — cannot see rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'iso-1', name: 'A', values: jsonVal([]) });
      await tableA.insert({ _id: 'iso-2', name: 'A2', values: jsonVal([]) });
      await tableB.insert({ _id: 'iso-3', name: 'B', values: jsonVal([]) });

      const rowsFromA = await tableA.findAll<TestRow>();

      expect(rowsFromA).toHaveLength(2);
      expect(rowsFromA.every(r => r.tenant_id === 'tenant-a')).toBe(true);
    });
  });

  describe('findIds', () => {
    it('should return _ids matching a where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'fid-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'fid-2', name: 'beta', values: jsonVal([]) });

      const ids = await table.findIds<TestRow>({ name: 'alpha' });

      expect(ids).toEqual(['fid-1']);
    });

    it('should return empty array when nothing matches', async () => {
      const table = createTable();
      const ids = await table.findIds<TestRow>({ _id: 'nonexistent' });
      expect(ids).toEqual([]);
    });

    it('should enforce tenant_id — cannot find ids from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'A data', values: jsonVal([]) });

      const ids = await tableB.findIds<TestRow>({ _id: 'shared-id' });
      expect(ids).toEqual([]);
    });
  });

  describe('count', () => {
    it('should count all rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'ct-1', name: 'first-count', values: jsonVal([]) });
      await table.insert({ _id: 'ct-2', name: 'second-count', values: jsonVal([]) });

      const count = await table.count<TestRow>();

      expect(count).toBe(2);
    });

    it('should count with where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'ctw-1', name: 'alpha-ct', values: jsonVal([]) });
      await table.insert({ _id: 'ctw-2', name: 'alpha-ct-2', values: jsonVal([]) });
      await table.insert({ _id: 'ctw-3', name: 'beta-ct', values: jsonVal([]) });

      const count = await table.count<TestRow>({ name: 'alpha-ct' });

      expect(count).toBe(1);
    });

    it('should support $ne operator', async () => {
      const table = createTable();
      await table.insert({ _id: 'ne-1', name: 'alpha-ne', values: jsonVal([]) });
      await table.insert({ _id: 'ne-2', name: 'beta-ne', values: jsonVal([]) });

      const count = await table.count<TestRow>({ _id: { $ne: 'ne-1' } });

      expect(count).toBe(1);
    });

    it('should return 0 when nothing matches', async () => {
      const table = createTable();

      const count = await table.count<TestRow>({ _id: 'nonexistent' });

      expect(count).toBe(0);
    });
  });

  describe('upsert', () => {
    it('should insert a row when it does not exist', async () => {
      const table = createTable();

      await table.upsert({ _id: 'ups-1', name: 'inserted', values: jsonVal([]) }, [
        '_id',
        'tenant_id',
      ]);

      const row = await table.findOne<TestRow>({ _id: 'ups-1' });
      expect(row).toBeDefined();
      expect(row!.name).toBe('inserted');
    });

    it('should update a row when it already exists on the same tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'ups-2', name: 'original', values: jsonVal([]) });

      await table.upsert({ _id: 'ups-2', name: 'updated', values: jsonVal([]) }, [
        '_id',
        'tenant_id',
      ]);

      const row = await table.findOne<TestRow>({ _id: 'ups-2' });
      expect(row!.name).toBe('updated');
    });

    it('should not conflict with a row from a different tenant with the same _id', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'cross-ups', name: 'A', values: jsonVal([]) });
      await tableB.upsert({ _id: 'cross-ups', name: 'B', values: jsonVal([]) }, [
        '_id',
        'tenant_id',
      ]);

      const rowA = await tableA.findOne<TestRow>({ _id: 'cross-ups' });
      const rowB = await tableB.findOne<TestRow>({ _id: 'cross-ups' });

      expect(rowA!.name).toBe('A');
      expect(rowB!.name).toBe('B');
    });
  });

  describe('update', () => {
    it('should update matching rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'up-1', name: 'old', values: jsonVal([]) });

      await table.update({ _id: 'up-1' }, { name: 'new' });

      const row = await table.findOne<TestRow>({ _id: 'up-1' });
      expect(row!.name).toBe('new');
    });

    it('should enforce tenant_id — cannot update rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'cross-tenant', name: 'original', values: jsonVal([]) });

      await tableB.update({ _id: 'cross-tenant' }, { name: 'hacked' });

      const row = await tableA.findOne<TestRow>({ _id: 'cross-tenant' });
      expect(row!.name).toBe('original');
    });
  });

  describe('delete', () => {
    it('should delete matching rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'del-1', name: 'temp', values: jsonVal([]) });

      await table.delete({ _id: 'del-1' });

      const count = await table.count<TestRow>();
      expect(count).toBe(0);
    });

    it('should enforce tenant_id — cannot delete rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'protected', name: 'keep me', values: jsonVal([]) });

      await tableB.delete({ _id: 'protected' });

      const row = await tableA.findOne<TestRow>({ _id: 'protected' });
      expect(row).toBeDefined();
    });
  });
});
