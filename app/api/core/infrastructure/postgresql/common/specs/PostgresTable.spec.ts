/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTable } from '../PostgresTable.js';

const DEFAULT_TENANT = 'tenant-a';

type TestRow = {
  _id: string;
  name: string;
  values: Record<string, unknown>[];
};

const createTable = (tenantId = DEFAULT_TENANT) => new PostgresTable('thesauri', tenantId);

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
      expect(rowsFromA.every((r: TestRow) => r.name.startsWith('A'))).toBe(true);
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
  });

  describe('join with tenant isolation', () => {
    beforeAll(async () => {
      await testingPG.pool!.query(`
        CREATE TABLE IF NOT EXISTS "thesauri_categories" (
          "_id" TEXT NOT NULL,
          "thesaurus_id" TEXT NOT NULL,
          "label" TEXT NOT NULL,
          "tenant_id" TEXT NOT NULL,
          PRIMARY KEY ("_id", "tenant_id")
        )
      `);
    });

    beforeEach(async () => {
      await testingPG.pool!.query('DELETE FROM "thesauri_categories"');
    });

    afterAll(async () => {
      await testingPG.pool!.query('DROP TABLE IF EXISTS "thesauri_categories"');
    });

    const createCategoryTable = (tenantId = DEFAULT_TENANT) =>
      new PostgresTable('thesauri_categories', tenantId);

    it('should join thesauri with categories and enforce tenant_id on the base table', async () => {
      const thesauriTable = createTable();
      const categoryTable = createCategoryTable();

      await thesauriTable.insert({ _id: 'th-1', name: 'Colors', values: jsonVal([]) });
      await categoryTable.insert({ _id: 'cat-1', thesaurus_id: 'th-1', label: 'Red' });

      const rows = await thesauriTable
        .query<TestRow & { label: string }>()
        .join('thesauri_categories', 'thesauri._id', 'thesauri_categories.thesaurus_id')
        .where({ 'thesauri._id': 'th-1' })
        .select(['thesauri._id', 'thesauri.name', 'thesauri_categories.label'])
        .all();

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Colors');
      expect(rows[0].label).toBe('Red');
    });

    it('should enforce tenant_id on the base table during join — cannot see rows from other tenants', async () => {
      const thesauriTableA = createTable('tenant-a');
      const categoryTableA = createCategoryTable('tenant-a');
      const thesauriTableB = createTable('tenant-b');
      const categoryTableB = createCategoryTable('tenant-b');

      await thesauriTableA.insert({ _id: 'shared-th', name: 'A thesaurus', values: jsonVal([]) });
      await categoryTableA.insert({ _id: 'cat-a', thesaurus_id: 'shared-th', label: 'A category' });

      await thesauriTableB.insert({ _id: 'shared-th', name: 'B thesaurus', values: jsonVal([]) });
      await categoryTableB.insert({ _id: 'cat-b', thesaurus_id: 'shared-th', label: 'B category' });

      const rowsFromB = await thesauriTableB
        .query<TestRow & { label: string }>()
        .join('thesauri_categories', 'thesauri._id', 'thesauri_categories.thesaurus_id')
        .where({ 'thesauri._id': 'shared-th' })
        .select(['thesauri._id', 'thesauri.name', 'thesauri_categories.label'])
        .all();

      expect(rowsFromB).toHaveLength(1);
      expect(rowsFromB[0].name).toBe('B thesaurus');
      expect(rowsFromB[0].label).toBe('B category');
    });

    it('should leftJoin and return base rows even without matching join rows', async () => {
      const thesauriTable = createTable();

      await thesauriTable.insert({ _id: 'th-empty', name: 'Empty', values: jsonVal([]) });
      // No categories inserted

      const rows = await thesauriTable
        .query<TestRow & { label: string | null }>()
        .leftJoin('thesauri_categories', 'thesauri._id', 'thesauri_categories.thesaurus_id')
        .where({ 'thesauri._id': 'th-empty' })
        .select(['thesauri._id', 'thesauri.name', 'thesauri_categories.label'])
        .all();

      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Empty');
      expect(rows[0].label).toBeUndefined();
    });

    it('should leftJoin and enforce tenant_id — cannot access rows from other tenants', async () => {
      const thesauriTableA = createTable('tenant-a');
      const categoryTableB = createCategoryTable('tenant-b');

      await thesauriTableA.insert({ _id: 'th-iso', name: 'Isolated', values: jsonVal([]) });
      await categoryTableB.insert({ _id: 'cat-iso', thesaurus_id: 'th-iso', label: 'B data' });

      const rowsFromA = await thesauriTableA
        .query<TestRow & { label: string | null }>()
        .leftJoin('thesauri_categories', 'thesauri._id', 'thesauri_categories.thesaurus_id')
        .where({ 'thesauri._id': 'th-iso' })
        .select(['thesauri._id', 'thesauri.name', 'thesauri_categories.label'])
        .all();

      expect(rowsFromA).toHaveLength(1);
      expect(rowsFromA[0].name).toBe('Isolated');
      expect(rowsFromA[0].label).toBeUndefined();
    });
  });

  describe('distinct', () => {
    it('should return distinct values for the current tenant', async () => {
      const table = createTable();
      await table.insert({ _id: 'd-1', name: 'alpha', values: jsonVal([]) });
      await table.insert({ _id: 'd-2', name: 'beta', values: jsonVal([]) });
      await table.insert({ _id: 'd-3', name: 'gamma', values: jsonVal([]) });

      const rows = await table.query<{ name: string }>().distinct(['name']).all();

      expect(rows.map(r => r.name).sort()).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('should enforce tenant_id — cannot see distinct values from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'da-1', name: 'name-a', values: jsonVal([]) });
      await tableA.insert({ _id: 'da-2', name: 'name-b', values: jsonVal([]) });
      await tableB.insert({ _id: 'db-1', name: 'name-c', values: jsonVal([]) });
      await tableB.insert({ _id: 'db-2', name: 'name-d', values: jsonVal([]) });

      const rowsFromA = await tableA.query<{ name: string }>().distinct(['name']).all();

      expect(rowsFromA.map(r => r.name).sort()).toEqual(['name-a', 'name-b']);
    });
  });

  describe('groupBy', () => {
    it('should group rows by a column', async () => {
      const table = createTable();
      await table.insert({ _id: 'g-1', name: 'alpha-one', values: jsonVal([]) });
      await table.insert({ _id: 'g-2', name: 'alpha-two', values: jsonVal([]) });
      await table.insert({ _id: 'g-3', name: 'beta-one', values: jsonVal([]) });

      const rows = await table.query<{ name: string }>().select(['name']).groupBy(['name']).all();

      const names = rows.map(r => r.name).sort();
      expect(names).toEqual(['alpha-one', 'alpha-two', 'beta-one']);
    });

    it('should enforce tenant_id — cannot group rows from other tenants', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'ga-1', name: 'group-a-1', values: jsonVal([]) });
      await tableA.insert({ _id: 'ga-2', name: 'group-a-2', values: jsonVal([]) });
      await tableB.insert({ _id: 'gb-1', name: 'group-b-1', values: jsonVal([]) });

      const rowsFromA = await tableA
        .query<{ name: string }>()
        .select(['name'])
        .groupBy(['name'])
        .all();

      const names = rowsFromA.map(r => r.name).sort();
      expect(names).toEqual(['group-a-1', 'group-a-2']);
    });
  });

  describe('raw', () => {
    it('should execute raw SQL with tenant_id filter', async () => {
      const table = createTable('tenant-a');
      await table.insert({ _id: 'raw-1', name: 'before', values: jsonVal([]) });

      await table.raw('UPDATE "thesauri" SET name = ? WHERE "_id" = ? AND "tenant_id" = ?', [
        'after',
        'raw-1',
        'tenant-a',
      ]);

      const row = await table.query<TestRow>().where({ _id: 'raw-1' }).first();
      expect(row!.name).toBe('after');
    });

    it('should throw when tenant_id filter is missing', async () => {
      const table = createTable('tenant-a');

      await expect(async () =>
        table.raw('UPDATE "thesauri" SET name = "x" WHERE "_id" = ?', ['raw-2'])
      ).rejects.toThrow('missing a tenant_id filter');
    });

    it('should enforce tenant_id — cannot affect rows from other tenants via raw', async () => {
      const tableA = createTable('tenant-a');
      const tableB = createTable('tenant-b');

      await tableA.insert({ _id: 'protected-raw', name: 'keep me', values: jsonVal([]) });
      await tableB.insert({ _id: 'protected-raw', name: 'other', values: jsonVal([]) });

      await tableB.raw(
        'UPDATE "thesauri" SET name = \'hacked\' WHERE "_id" = ? AND "tenant_id" = ?',
        ['protected-raw', 'tenant-b']
      );

      const rowA = await tableA.query<TestRow>().where({ _id: 'protected-raw' }).first();
      expect(rowA!.name).toBe('keep me');
    });
  });
});
