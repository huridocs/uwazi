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

  describe('insert (array)', () => {
    it('should auto-add tenant_id to all inserted rows', async () => {
      const table = createTable();

      await table.insert([
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

  describe('query().where().first()', () => {
    it('should return a row matching the where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'id-1', name: 'test-find', values: jsonVal([]) });

      const row = await table.query<TestRow>().where({ _id: 'id-1' }).first();

      expect(row).toBeDefined();
      expect(row!._id).toBe('id-1');
      expect(row!.name).toBe('test-find');
    });

    it('should return undefined when no row matches', async () => {
      const table = createTable();

      const row = await table.query<TestRow>().where({ _id: 'nonexistent' }).first();

      expect(row).toBeUndefined();
    });

    it('should enforce tenant_id filtering — cannot see rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'tenant A data', values: jsonVal([]) });

      const rowFromB = await tableB.query<TestRow>().where({ _id: 'shared-id' }).first();

      expect(rowFromB).toBeUndefined();
    });
  });

  describe('query().where().all()', () => {
    it('should return all rows for the tenant when no where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'find-all-1', name: 'first', values: jsonVal([]) });
      await table.insert({ _id: 'find-all-2', name: 'second', values: jsonVal([]) });

      const rows = await table.query<TestRow>().all();

      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.tenant_id === DEFAULT_TENANT)).toBe(true);
    });

    it('should filter by where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'filter-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'filter-2', name: 'beta', values: jsonVal([]) });

      const rows = await table.query<TestRow>().where({ name: 'alpha' }).all();

      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('filter-1');
    });

    it('should support whereIn', async () => {
      const table = createTable();
      await table.insert({ _id: 'in-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'in-2', name: 'beta', values: jsonVal([]) });
      await table.insert({ _id: 'in-3', name: 'gamma', values: jsonVal([]) });

      const rows = await table.query<TestRow>().whereIn('_id', ['in-1', 'in-3']).all();

      expect(rows).toHaveLength(2);
      expect(rows.map((r: TestRow) => r._id).sort()).toEqual(['in-1', 'in-3']);
    });

    it('should enforce tenant_id — cannot see rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'iso-1', name: 'A', values: jsonVal([]) });
      await tableA.insert({ _id: 'iso-2', name: 'A2', values: jsonVal([]) });
      await tableB.insert({ _id: 'iso-3', name: 'B', values: jsonVal([]) });

      const rowsFromA = await tableA.query<TestRow>().all();

      expect(rowsFromA).toHaveLength(2);
      expect(rowsFromA.every((r: TestRow) => r.tenant_id === 'tenant-a')).toBe(true);
    });
  });

  describe('query().where().select().all() — findIds equivalent', () => {
    it('should return _ids matching a where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'fid-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'fid-2', name: 'beta', values: jsonVal([]) });

      const rows = await table.query<TestRow>().where({ name: 'alpha' }).select(['_id']).all();

      expect(rows.map(r => r._id)).toEqual(['fid-1']);
    });

    it('should return empty array when nothing matches', async () => {
      const table = createTable();
      const rows = await table.query<TestRow>().where({ _id: 'nonexistent' }).select(['_id']).all();
      expect(rows).toEqual([]);
    });

    it('should enforce tenant_id — cannot find ids from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'A data', values: jsonVal([]) });

      const rows = await tableB.query<TestRow>().where({ _id: 'shared-id' }).select(['_id']).all();
      expect(rows).toEqual([]);
    });

    it('should return empty array when nothing matches', async () => {
      const table = createTable();
      const rows = await table
        .query<{ _id: string }>()
        .where({ _id: 'nonexistent' })
        .select(['_id'])
        .all();
      expect(rows).toEqual([]);
    });

    it('should enforce tenant_id — cannot find ids from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'A data', values: jsonVal([]) });

      const rows = await tableB
        .query<{ _id: string }>()
        .where({ _id: 'shared-id' })
        .select(['_id'])
        .all();
      expect(rows).toEqual([]);
    });

    it('should return empty array when nothing matches', async () => {
      const table = createTable();
      const rows = await table
        .query<Pick<TestRow, '_id'>>()
        .where({ _id: 'nonexistent' })
        .select(['_id'])
        .all();
      expect(rows).toEqual([]);
    });

    it('should enforce tenant_id — cannot find ids from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'shared-id', name: 'A data', values: jsonVal([]) });

      const rows = await tableB
        .query<Pick<TestRow, '_id'>>()
        .where({ _id: 'shared-id' })
        .select(['_id'])
        .all();
      expect(rows).toEqual([]);
    });
  });

  describe('query().where().count()', () => {
    it('should count all rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'ct-1', name: 'first-count', values: jsonVal([]) });
      await table.insert({ _id: 'ct-2', name: 'second-count', values: jsonVal([]) });

      const count = await table.query<TestRow>().count();

      expect(count).toBe(2);
    });

    it('should count with where condition', async () => {
      const table = createTable();
      await table.insert({ _id: 'ctw-1', name: 'alpha-ct', values: jsonVal([]) });
      await table.insert({ _id: 'ctw-2', name: 'alpha-ct-2', values: jsonVal([]) });
      await table.insert({ _id: 'ctw-3', name: 'beta-ct', values: jsonVal([]) });

      const count = await table.query<TestRow>().where({ name: 'alpha-ct' }).count();

      expect(count).toBe(1);
    });

    it('should support whereNot', async () => {
      const table = createTable();
      await table.insert({ _id: 'ne-1', name: 'alpha-ne', values: jsonVal([]) });
      await table.insert({ _id: 'ne-2', name: 'beta-ne', values: jsonVal([]) });

      const count = await table.query<TestRow>().whereNot('_id', 'ne-1').count();

      expect(count).toBe(1);
    });

    it('should return 0 when nothing matches', async () => {
      const table = createTable();

      const count = await table.query<TestRow>().where({ _id: 'nonexistent' }).count();

      expect(count).toBe(0);
    });
  });

  describe('upsert', () => {
    it('should insert a row when it does not exist', async () => {
      const table = createTable();

      await table.upsert({ _id: 'ups-1', name: 'inserted', values: jsonVal([]) });

      const row = await table.query<TestRow>().where({ _id: 'ups-1' }).first();
      expect(row).toBeDefined();
      expect(row!.name).toBe('inserted');
    });

    it('should update a row when it already exists on the same tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'ups-2', name: 'original', values: jsonVal([]) });

      await table.upsert({ _id: 'ups-2', name: 'updated', values: jsonVal([]) });

      const row = await table.query<TestRow>().where({ _id: 'ups-2' }).first();
      expect(row!.name).toBe('updated');
    });

    it('should not conflict with a row from a different tenant with the same _id', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'cross-ups', name: 'A', values: jsonVal([]) });
      await tableB.upsert({ _id: 'cross-ups', name: 'B', values: jsonVal([]) });

      const rowA = await tableA.query<TestRow>().where({ _id: 'cross-ups' }).first();
      const rowB = await tableB.query<TestRow>().where({ _id: 'cross-ups' }).first();

      expect(rowA!.name).toBe('A');
      expect(rowB!.name).toBe('B');
    });
  });

  describe('query().where().update()', () => {
    it('should update matching rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'up-1', name: 'old', values: jsonVal([]) });

      await table.query().where({ _id: 'up-1' }).update({ name: 'new' });

      const row = await table.query<TestRow>().where({ _id: 'up-1' }).first();
      expect(row!.name).toBe('new');
    });

    it('should enforce tenant_id — cannot update rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'cross-tenant', name: 'original', values: jsonVal([]) });

      await tableB.query().where({ _id: 'cross-tenant' }).update({ name: 'hacked' });

      const row = await tableA.query<TestRow>().where({ _id: 'cross-tenant' }).first();
      expect(row!.name).toBe('original');
    });
  });

  describe('query().where().delete()', () => {
    it('should delete matching rows for the tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'del-1', name: 'temp', values: jsonVal([]) });

      await table.query().where({ _id: 'del-1' }).delete();

      const count = await table.query<TestRow>().count();
      expect(count).toBe(0);
    });

    it('should enforce tenant_id — cannot delete rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'protected', name: 'keep me', values: jsonVal([]) });

      await tableB.query().where({ _id: 'protected' }).delete();

      const row = await tableA.query<TestRow>().where({ _id: 'protected' }).first();
      expect(row).toBeDefined();
    });
  });

  describe('query builder chaining', () => {
    it('should support orderBy', async () => {
      const table = createTable();
      await table.insert({ _id: 'chain-1', name: 'zeta', values: jsonVal([]) });
      await table.insert({ _id: 'chain-2', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'chain-3', name: 'beta', values: jsonVal([]) });

      const rows = await table.query<TestRow>().orderBy('name', 'asc').all();

      expect(rows.map((r: TestRow) => r.name)).toEqual(['alpha', 'beta', 'zeta']);
    });

    it('should support limit', async () => {
      const table = createTable();
      await table.insert({ _id: 'l-1', name: 'a', values: jsonVal([]) });
      await table.insert({ _id: 'l-2', name: 'b', values: jsonVal([]) });
      await table.insert({ _id: 'l-3', name: 'c', values: jsonVal([]) });

      const rows = await table.query<TestRow>().orderBy('name').limit(2).all();

      expect(rows).toHaveLength(2);
    });

    it('should support offset', async () => {
      const table = createTable();
      await table.insert({ _id: 'o-1', name: 'a', values: jsonVal([]) });
      await table.insert({ _id: 'o-2', name: 'b', values: jsonVal([]) });
      await table.insert({ _id: 'o-3', name: 'c', values: jsonVal([]) });

      const rows = await table.query<TestRow>().orderBy('name').offset(1).all();

      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe('b');
    });

    it('should support rawWhere', async () => {
      const table = createTable();
      await table.insert({ _id: 'raw-1', name: 'special', values: jsonVal([]) });

      const rows = await table.query<TestRow>().rawWhere('"name" ILIKE ?', ['%spec%']).all();

      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('raw-1');
    });
  });
});
