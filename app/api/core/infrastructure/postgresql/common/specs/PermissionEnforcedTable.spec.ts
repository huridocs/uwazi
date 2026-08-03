/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { PermissionEnforcedTable } from '../PermissionEnforcedTable.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import type { PostgresPermissionTranslator } from '../PostgresPermissionTranslator.js';
import type { Knex } from 'knex';

// ── Test table ───────────────────────────────────────────────────────────────

const TEST_TABLE = 'permission_test';
const DEFAULT_TENANT = 'tenant-a';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

type TestRow = {
  _id: string;
  name: string;
  published: boolean;
  permissions: { refId: string; type: string; level: string }[];
};

// ── Test translator ──────────────────────────────────────────────────────────

class TestPermissionTranslator implements PostgresPermissionTranslator {
  requiredColumns(): string[] {
    return ['published', 'permissions'];
  }

  applyReadCondition(qb: Knex.QueryBuilder, ac: AccessContext): Knex.QueryBuilder {
    if (ac.isPrivileged()) return qb;
    if (ac.isAnonymous()) return qb.where({ published: true });

    return qb.where(function (this: Knex.QueryBuilder) {
      this.where({ published: true });
      for (const refId of ac.refIds) {
        this.orWhereRaw('permissions @> ?::jsonb', [JSON.stringify([{ refId }])]);
      }
    });
  }

  applyWriteCondition(qb: Knex.QueryBuilder, ac: AccessContext, tableName?: string): Knex.QueryBuilder {
    if (ac.isPrivileged()) return qb;
    if (ac.isAnonymous()) return qb.where({ _id: null });

    const refIds = ac.refIds;
    if (refIds.length === 0) return qb.where({ _id: null });

    const col = tableName ? `${tableName}.permissions` : 'permissions';
    const sql = refIds.map(() => `${col} @> ?::jsonb`).join(' OR ');
    const bindings = refIds.map(id => JSON.stringify([{ refId: id, level: 'write' }]));
    return qb.whereRaw(`(${sql})`, bindings);
  }
}

const createEnforcedTable = (accessContext: AccessContext, tenantId = DEFAULT_TENANT) =>
  PermissionEnforcedTable.for<TestRow>({
    tableName: TEST_TABLE,
    tenantId,
    transactionManager: managerFor(tenantId),
    accessContext,
    translator: new TestPermissionTranslator(),
  });

// ── Test actors ──────────────────────────────────────────────────────────────

const admin = new User('admin-1', 'admin', []);
const editor = new User('editor-1', 'editor', []);
const collaborator = new User('collab-1', 'collaborator', ['group-a']);
const otherUser = new User('other-1', 'collaborator', []);
const anon = User.createFrom(null);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const fixtures: Array<{ _id: string; name: string; published: boolean; permissions: string }> = [
  { _id: 'ent-pub', name: 'published', published: true, permissions: '[]' },
  {
    _id: 'ent-write',
    name: 'private-write',
    published: false,
    permissions: JSON.stringify([
      { refId: 'collab-1', type: 'user', level: 'write' },
      { refId: 'group-a', type: 'group', level: 'read' },
    ]),
  },
  {
    _id: 'ent-read',
    name: 'private-read',
    published: false,
    permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'read' }]),
  },
  {
    _id: 'ent-none',
    name: 'private-none',
    published: false,
    permissions: JSON.stringify([{ refId: 'other-1', type: 'user', level: 'write' }]),
  },
];

const insertFixtures = async () => {
  const raw = managerFor(DEFAULT_TENANT);
  await raw.withConnection(async trx => {
    for (const row of fixtures) {
      await trx(TEST_TABLE).insert({ ...row, tenant_id: DEFAULT_TENANT });
    }
  });
};

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
  await testingPG.pool!.query(`
    CREATE TABLE IF NOT EXISTS ${TEST_TABLE} (
      "_id"         TEXT NOT NULL,
      "name"        TEXT NOT NULL,
      "published"   BOOLEAN NOT NULL DEFAULT false,
      "permissions" JSONB NOT NULL DEFAULT '[]',
      "tenant_id"   TEXT NOT NULL,
      PRIMARY KEY ("_id", "tenant_id")
    )
  `);
  await testingPG.pool!.query(`ALTER TABLE ${TEST_TABLE} ENABLE ROW LEVEL SECURITY`);
  await testingPG.pool!.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = '${TEST_TABLE}' AND policyname = 'tenant_isolation'
      ) THEN
        CREATE POLICY tenant_isolation ON ${TEST_TABLE}
          USING (tenant_id = current_tenant())
          WITH CHECK (tenant_id = current_tenant());
      END IF;
    END;
    $$
  `);
});

beforeEach(async () => {
  await testingPG.pool!.query(`DELETE FROM ${TEST_TABLE}`);
  await insertFixtures();
});

afterAll(async () => {
  await testingPG.pool!.query(`DROP TABLE IF EXISTS ${TEST_TABLE}`);
  await testingEnvironment.tearDown();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PermissionEnforcedTable', () => {
  describe('all() — read enforcement', () => {
    it('admin sees all rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const rows = await table.all();
      expect(rows).toHaveLength(4);
    });

    it('editor sees all rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(editor));
      const rows = await table.all();
      expect(rows).toHaveLength(4);
    });

    it('collaborator sees published + rows where they are in permissions', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });

    it('anonymous sees only published rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table.all();
      const ids = rows.map(r => r._id);
      expect(ids).toEqual(['ent-pub']);
    });

    it('system bypass sees all rows', async () => {
      const table = createEnforcedTable(AccessContext.system());
      const rows = await table.all();
      expect(rows).toHaveLength(4);
    });
  });

  describe('first() — read enforcement', () => {
    it('collaborator can first() a row they have read access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table.where({ _id: 'ent-read' }).first();
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-read');
    });

    it('collaborator gets undefined when first() on a row they cannot read', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table.where({ _id: 'ent-none' }).first();
      expect(row).toBeUndefined();
    });
  });

  describe('count() — read enforcement', () => {
    it('collaborator count excludes inaccessible rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const n = await table.count();
      expect(n).toBe(3);
    });

    it('anonymous count only includes published rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const n = await table.count();
      expect(n).toBe(1);
    });
  });

  describe('update() — write enforcement', () => {
    it('collaborator can update a row they have write access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-write' }).update({ name: 'updated' });
      expect(ids).toEqual(['ent-write']);
    });

    it('collaborator cannot update a row they only have read access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-read' }).update({ name: 'updated' });
      expect(ids).toEqual([]);
    });

    it('collaborator cannot update a row they have no access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-none' }).update({ name: 'updated' });
      expect(ids).toEqual([]);
    });

    it('admin can update any row', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const ids = await table.where({ _id: 'ent-none' }).update({ name: 'updated' });
      expect(ids).toEqual(['ent-none']);
    });

    it('anonymous cannot update any row', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const ids = await table.where({ _id: 'ent-pub' }).update({ name: 'updated' });
      expect(ids).toEqual([]);
    });

    it('update() returns matched _ids', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.whereIn('_id', ['ent-write', 'ent-read', 'ent-none']).update({ name: 'x' });
      expect(ids).toEqual(['ent-write']);
    });
  });

  describe('delete() — write enforcement', () => {
    it('collaborator can delete a row they have write access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-write' }).delete();
      expect(ids).toEqual(['ent-write']);
    });

    it('collaborator cannot delete a row they only have read access to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-read' }).delete();
      expect(ids).toEqual([]);
    });

    it('delete() returns matched _ids', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.whereIn('_id', ['ent-write', 'ent-read']).delete();
      expect(ids).toEqual(['ent-write']);
    });
  });

  describe('insert() — gate check', () => {
    it('collaborator can insert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.insert({ _id: 'ent-new', name: 'new-row', published: true, permissions: '[]' });
      const row = await table.where({ _id: 'ent-new' }).first();
      expect(row).toBeDefined();
    });

    it('anonymous cannot insert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      await expect(
        table.insert({ _id: 'ent-new', name: 'new-row', published: false, permissions: '[]' })
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('system bypass can insert', async () => {
      const table = createEnforcedTable(AccessContext.system());
      await table.insert({ _id: 'ent-sys', name: 'sys-row', published: false, permissions: '[]' });
      const row = await table.where({ _id: 'ent-sys' }).first();
      expect(row).toBeDefined();
    });
  });

  describe('upsert() — gate check', () => {
    it('collaborator can upsert (insert path)', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.upsert({ _id: 'ent-upsert-new', name: 'upserted', published: true, permissions: '[]' });
      const row = await table.where({ _id: 'ent-upsert-new' }).first();
      expect(row).toBeDefined();
      expect(row!.name).toBe('upserted');
    });

    it('collaborator can upsert (update path — existing row)', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      // ent-write already exists and collaborator has write access
      await table.upsert({ _id: 'ent-write', name: 'upserted-name', published: false, permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'write' }]) });
      const row = await table.where({ _id: 'ent-write' }).first();
      expect(row).toBeDefined();
      expect(row!.name).toBe('upserted-name');
    });

    it('collaborator cannot upsert a row they do not have write access to', async () => {
      const adminTable = createEnforcedTable(AccessContext.forActor(admin));
      const before = await adminTable.where({ _id: 'ent-none' }).first();
      expect(before!.name).toBe('private-none');

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      // ent-none has permissions for other-1, not collab-1
      // The ON CONFLICT DO UPDATE WHERE should not match → row unchanged
      await table.upsert({
        _id: 'ent-none',
        name: 'hacked',
        published: false,
        permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'write' }]),
      });

      const after = await adminTable.where({ _id: 'ent-none' }).first();
      expect(after!.name).toBe('private-none');
    });

    it('admin can upsert any row', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      await table.upsert({ _id: 'ent-none', name: 'admin-upserted', published: false, permissions: '[]' });
      const row = await table.where({ _id: 'ent-none' }).first();
      expect(row).toBeDefined();
      expect(row!.name).toBe('admin-upserted');
    });

    it('anonymous cannot upsert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      await expect(
        table.upsert({ _id: 'ent-upsert-anon', name: 'nope', published: true, permissions: '[]' })
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('system bypass can upsert', async () => {
      const table = createEnforcedTable(AccessContext.system());
      await table.upsert({ _id: 'ent-upsert-sys', name: 'sys-upsert', published: false, permissions: '[]' });
      const row = await table.where({ _id: 'ent-upsert-sys' }).first();
      expect(row).toBeDefined();
    });
  });

  describe('whereRaw — OR safety', () => {
    it('OR in whereRaw does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereRaw("_id = 'ent-none' OR _id = 'ent-read'")
        .all();
      const ids = rows.map(r => r._id).sort();
      // ent-none is unreadable and in first OR position, but subquery contains it
      expect(ids).toEqual(['ent-read']);
    });

    it('OR in whereRaw does not bypass write enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .whereRaw("_id = 'ent-read' OR _id = 'ent-write'")
        .update({ name: 'hacked' });
      expect(ids).toEqual(['ent-write']);
    });
  });

  describe('chain immutability', () => {
    it('chain methods return PermissionEnforcedTable, not plain PostgresTable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const chained = table.where({ _id: 'ent-pub' }).select(['_id']);
      expect(chained).toBeInstanceOf(PermissionEnforcedTable);
      const rows = await chained.all();
      expect(rows).toHaveLength(1);
    });

    it('query() returns PermissionEnforcedTable, not plain PostgresTable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const queried = table.query();
      expect(queried).toBeInstanceOf(PermissionEnforcedTable);
      const rows = await queried.all();
      expect(rows).toHaveLength(4);
    });
  });

  describe('orWhere — read enforcement', () => {
    it('OR does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .where({ _id: 'ent-read' })
        .orWhere({ _id: 'ent-none' })
        .all();
      const ids = rows.map(r => r._id).sort();
      // ent-read is readable, ent-none is not
      expect(ids).toEqual(['ent-read']);
    });

    it('OR does not bypass write enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .where({ _id: 'ent-write' })
        .orWhere({ _id: 'ent-read' })
        .update({ name: 'hacked' });
      // ent-write is writable, ent-read is only readable
      expect(ids).toEqual(['ent-write']);
    });
  });

  describe('whereBetween', () => {
    it('range query does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereBetween('_id', ['ent-a', 'ent-z'])
        .all();
      const ids = rows.map(r => r._id).sort();
      // all 4 fixtures are in range, but ent-none is not readable
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });
  });

  describe('whereLike', () => {
    it('pattern match does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereLike('_id', 'ent-%')
        .all();
      const ids = rows.map(r => r._id).sort();
      // all 4 match 'ent-%', but ent-none is not readable
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });
  });

  describe('whereExists', () => {
    it('subquery existence does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      // All rows exist in the same table, so WHERE EXISTS matches all.
      // But ent-none should still be filtered by permissions.
      const rows = await table
        .whereExists(function (this: Knex.QueryBuilder) {
          this.select('*').from(TEST_TABLE).whereRaw('1=1');
        })
        .all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });
  });

  describe('having', () => {
    it('HAVING filter does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id'])
        .groupBy(['_id'])
        .having('_id', '>', 'ent-a')
        .all();
      const ids = rows.map(r => r._id).sort();
      // ent-none is not readable even though it passes HAVING
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });

    it('GROUP BY + OR does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id'])
        .where({ _id: 'ent-none' })   // unreadable, in first OR position
        .orWhere({ _id: 'ent-read' })  // readable
        .groupBy(['_id'])
        .all();
      const ids = rows.map(r => r._id).sort();
      // GROUP BY is on the outer query, OR is contained in the inner subquery.
      // ent-none is filtered by the outer permission WHERE before grouping.
      expect(ids).toEqual(['ent-read']);
    });

    it('GROUP BY correctly collapses rows with same value', async () => {
      // Insert rows that share a group key
      const raw = managerFor(DEFAULT_TENANT);
      await raw.withConnection(async trx => {
        await trx(TEST_TABLE).insert({
          _id: 'grp-a1', name: 'group-a-1', published: true, permissions: '[]', tenant_id: DEFAULT_TENANT,
        });
        await trx(TEST_TABLE).insert({
          _id: 'grp-a2', name: 'group-a-2', published: true, permissions: '[]', tenant_id: DEFAULT_TENANT,
        });
        await trx(TEST_TABLE).insert({
          _id: 'grp-b1', name: 'group-b-1', published: false,
          permissions: JSON.stringify([{ refId: 'other-1', type: 'user', level: 'write' }]),
          tenant_id: DEFAULT_TENANT,
        });
      });

      const table = createEnforcedTable(AccessContext.forActor(admin));
      const rows = await table
        .select(['published'])
        .groupBy(['published'])
        .orderBy('published', 'asc')
        .all();

      // 7 rows total: 3 published=true, 4 published=false → 2 groups
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.published)).toEqual([false, true]);
    });
  });

  describe('distinct', () => {
    it('distinct does not bypass read enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .distinct(['published'])
        .all();
      // collaborator sees 3 readable rows: published values are [true, false, false]
      // DISTINCT collapses to [true, false]
      const vals = rows.map(r => r.published).sort();
      expect(vals).toEqual([false, true]);
    });

    it('distinct preserves deduplication with enforcement', async () => {
      const raw = managerFor(DEFAULT_TENANT);
      await raw.withConnection(async trx => {
        await trx(TEST_TABLE).insert({
          _id: 'dup-1', name: 'dup-1', published: true, permissions: '[]', tenant_id: DEFAULT_TENANT,
        });
        await trx(TEST_TABLE).insert({
          _id: 'dup-2', name: 'dup-2', published: true, permissions: '[]', tenant_id: DEFAULT_TENANT,
        });
      });

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .distinct(['published'])
        .all();
      // collaborator sees: ent-pub(pub), ent-write(!pub), ent-read(!pub), dup-1(pub), dup-2(pub)
      // DISTINCT published → [true, false]
      expect(rows).toHaveLength(2);
    });
  });

  describe('combined queries — select + sort preserved', () => {
    it('select fields are preserved with permission enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .where({ _id: 'ent-write' })
        .select(['_id', 'name'])
        .all();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveProperty('_id');
      expect(rows[0]).toHaveProperty('name');
      expect(rows[0]).not.toHaveProperty('published');
      expect(rows[0]).not.toHaveProperty('permissions');
    });

    it('sorting is preserved with permission enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const rows = await table
        .select(['_id', 'name'])
        .orderBy('name', 'asc')
        .all();
      const names = rows.map(r => r.name);
      expect(names).toEqual([
        'private-none',
        'private-read',
        'private-write',
        'published',
      ]);
    });

    it('select + where + orWhere + orderBy + limit with enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id', 'name'])
        .where({ _id: 'ent-read' })
        .orWhere({ _id: 'ent-none' })
        .orWhere({ _id: 'ent-write' })
        .orderBy('name', 'asc')
        .limit(2)
        .all();
      // ent-none is filtered by permissions, ent-read and ent-write remain
      const ids = rows.map(r => r._id);
      expect(ids).toEqual(['ent-read', 'ent-write']);
      expect(rows).toHaveLength(2);
      // select fields preserved
      rows.forEach(r => {
        expect(r).toHaveProperty('_id');
        expect(r).toHaveProperty('name');
        expect(r).not.toHaveProperty('published');
      });
    });

    it('whereIn + select + orderBy with enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id', 'name'])
        .whereIn('_id', ['ent-pub', 'ent-read', 'ent-none', 'ent-write'])
        .orderBy('_id', 'asc')
        .all();
      const ids = rows.map(r => r._id);
      // ent-none filtered out
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });

    it('where + orderBy + first preserves sort and enforces permissions', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table
        .select(['_id', 'name'])
        .whereIn('_id', ['ent-none', 'ent-read'])
        .orderBy('_id', 'asc')
        .first();
      // ent-none is not readable, ent-read is first alphabetically among readable
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-read');
      expect(row!).toHaveProperty('name');
      expect(row!).not.toHaveProperty('published');
    });

    it('anonymous with select + orderBy + limit only sees published', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table
        .select(['_id', 'name'])
        .orderBy('_id', 'asc')
        .limit(10)
        .all();
      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('ent-pub');
    });
  });

  describe('combined queries — write with OR', () => {
    it('where + orWhere + update enforces permissions', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .where({ _id: 'ent-write' })
        .orWhere({ _id: 'ent-read' })
        .orWhere({ _id: 'ent-none' })
        .update({ name: 'hacked' });
      // only ent-write is writable
      expect(ids).toEqual(['ent-write']);
    });

    it('where + orWhere + delete enforces permissions', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .where({ _id: 'ent-write' })
        .orWhere({ _id: 'ent-read' })
        .delete();
      // only ent-write is writable
      expect(ids).toEqual(['ent-write']);
    });
  });

  describe('edge cases — aggregates with OR', () => {
    it('count() with OR excludes unreadable rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const n = await table
        .whereRaw("_id = 'ent-none' OR _id = 'ent-read' OR _id = 'ent-write'")
        .count();
      // ent-none is unreadable → only 2 counted
      expect(n).toBe(2);
    });

    it('count() with whereIn mixed access', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const n = await table
        .whereIn('_id', ['ent-none', 'ent-read', 'ent-write', 'ent-pub'])
        .count();
      // all 4 match, but ent-none is unreadable → 3 counted
      expect(n).toBe(3);
    });
  });

  describe('edge cases — offset and limit', () => {
    it('offset skips rows after permission filtering', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id'])
        .orderBy('_id', 'asc')
        .offset(1)
        .limit(10)
        .all();
      // collaborator sees: ent-pub, ent-read, ent-write (sorted)
      // offset 1 skips ent-pub → [ent-read, ent-write]
      expect(rows.map(r => r._id)).toEqual(['ent-read', 'ent-write']);
    });

    it('limit smaller than readable rows returns only limit count', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id'])
        .orderBy('_id', 'asc')
        .limit(1)
        .all();
      // 3 readable rows, limit 1 → first one only
      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('ent-pub');
    });

    it('limit larger than readable rows returns all readable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['_id'])
        .orderBy('_id', 'asc')
        .limit(100)
        .all();
      // only 3 readable rows exist
      expect(rows).toHaveLength(3);
    });
  });

  describe('edge cases — empty results', () => {
    it('all() returns [] when all matched rows are unreadable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .where({ _id: 'ent-none' })
        .all();
      expect(rows).toEqual([]);
    });

    it('first() returns undefined when all matched rows are unreadable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table
        .where({ _id: 'ent-none' })
        .first();
      expect(row).toBeUndefined();
    });

    it('count() returns 0 when all matched rows are unreadable', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const n = await table
        .where({ _id: 'ent-none' })
        .count();
      expect(n).toBe(0);
    });
  });

  describe('edge cases — mixed write access in batch', () => {
    it('update with whereIn returns only writable IDs', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .whereIn('_id', ['ent-write', 'ent-read', 'ent-none', 'ent-pub'])
        .update({ name: 'batch-update' });
      // ent-write: writable, ent-read: read-only, ent-none: no access, ent-pub: read-only
      expect(ids).toEqual(['ent-write']);
    });

    it('delete with whereIn returns only writable IDs', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .whereIn('_id', ['ent-write', 'ent-read', 'ent-none'])
        .delete();
      expect(ids).toEqual(['ent-write']);
    });

    it('update with whereIn where none are writable returns []', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .whereIn('_id', ['ent-read', 'ent-none'])
        .update({ name: 'nope' });
      expect(ids).toEqual([]);
    });
  });

  describe('edge cases — whereAny and whereNot', () => {
    it('whereAny with unreadable first does not bypass', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereAny([{ _id: 'ent-none' }, { _id: 'ent-read' }])
        .all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });

    it('whereNot does not bypass permission enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      // whereNot _id = 'ent-write' matches everything except ent-write
      // among readable: ent-pub, ent-read remain (ent-write excluded, ent-none not readable anyway)
      const rows = await table
        .whereNot('_id', 'ent-write')
        .all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub', 'ent-read']);
    });
  });

  describe('edge cases — no explicit select', () => {
    it('all() without select() returns rows with enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.all();
      expect(rows).toHaveLength(3);
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub', 'ent-read', 'ent-write']);
    });

    it('first() without select() returns a row with enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table.first();
      expect(row).toBeDefined();
    });
  });

  describe('edge cases — multiple whereRaw chains', () => {
    it('multiple whereRaw ANDed does not bypass', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereRaw("_id = 'ent-none' OR _id = 'ent-read'")
        .whereRaw("_id = 'ent-write' OR _id = 'ent-read'")
        .all();
      // First whereRaw: ent-none OR ent-read
      // Second whereRaw: ent-write OR ent-read
      // AND: only ent-read matches both
      // Permission: ent-read is readable
      expect(rows.map(r => r._id)).toEqual(['ent-read']);
    });
  });

  describe('edge cases — anonymous with complex queries', () => {
    it('anonymous + whereBetween only sees published in range', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table
        .whereBetween('_id', ['ent-a', 'ent-z'])
        .all();
      // all 4 are in range, but only ent-pub is published
      expect(rows.map(r => r._id)).toEqual(['ent-pub']);
    });

    it('anonymous + whereLike only sees published matches', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table
        .whereLike('_id', 'ent-%')
        .all();
      expect(rows.map(r => r._id)).toEqual(['ent-pub']);
    });

    it('anonymous + orWhere only sees published', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table
        .where({ _id: 'ent-none' })
        .orWhere({ _id: 'ent-pub' })
        .all();
      expect(rows.map(r => r._id)).toEqual(['ent-pub']);
    });
  });

  describe('edge cases — privileged users with complex queries', () => {
    it('admin + whereRaw OR sees all matched rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const rows = await table
        .whereRaw("_id = 'ent-none' OR _id = 'ent-read'")
        .all();
      expect(rows.map(r => r._id).sort()).toEqual(['ent-none', 'ent-read']);
    });

    it('editor + orWhere sees all matched rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(editor));
      const rows = await table
        .where({ _id: 'ent-none' })
        .orWhere({ _id: 'ent-read' })
        .all();
      expect(rows.map(r => r._id).sort()).toEqual(['ent-none', 'ent-read']);
    });

    it('system bypass + count sees all rows', async () => {
      const table = createEnforcedTable(AccessContext.system());
      const n = await table.count();
      expect(n).toBe(4);
    });
  });

  describe('returning() before update() does not affect result', () => {
    it('update returns only _id even if returning() was chained', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .where({ _id: 'ent-write' })
        .returning(['permissions'])
        .update({ name: 'updated' });
      // update() always returns string[] of _ids, regardless of chained returning()
      expect(ids).toEqual(['ent-write']);
    });
  });
});
