import type { Knex } from 'knex';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { PostgresPermissionEnforcedTable } from '../PostgresPermissionEnforcedTable.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';

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

const createEnforcedTable = (accessContext: AccessContext, tenantId = DEFAULT_TENANT) =>
  PostgresPermissionEnforcedTable.for<TestRow>({
    tableName: TEST_TABLE,
    tenantId,
    transactionManager: managerFor(tenantId),
    accessContext,
  });

const admin = new User('admin-1', 'admin', []);
const editor = new User('editor-1', 'editor', []);
const collaborator = new User('collab-1', 'collaborator', ['group-a']);
const otherUser = new User('other-1', 'collaborator', []);
const anon = User.createFrom(null);

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
  {
    _id: 'ent-group-read',
    name: 'group-read-only',
    published: false,
    permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'read' }]),
  },
  {
    _id: 'ent-group-write',
    name: 'group-write-only',
    published: false,
    permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'write' }]),
  },
];

const insertFixtures = async () => {
  const raw = managerFor(DEFAULT_TENANT);
  await raw.withConnection(async trx => {
    const rows = fixtures.map(row => ({ ...row, tenant_id: DEFAULT_TENANT }));
    await trx(TEST_TABLE).insert(rows);
  });
};

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
  await testingPG.pool!.query(`SELECT create_permission_rls_policies('${TEST_TABLE}')`);
});

beforeEach(async () => {
  await testingPG.pool!.query(`DELETE FROM ${TEST_TABLE}`);
  await insertFixtures();
});

afterAll(async () => {
  await testingPG.pool!.query(`DROP TABLE IF EXISTS ${TEST_TABLE}`);
  await testingEnvironment.tearDown();
});

const adminTable = () => createEnforcedTable(AccessContext.forActor(admin));

const assertIncludesNonPublished = (rows: TestRow[]) => {
  const nonPublished = rows.filter(r => !r.published);
  expect(nonPublished.length).toBeGreaterThan(0);
};

describe('PostgresPermissionEnforcedTable', () => {
  describe('read enforcement', () => {
    it('should let admin see all rows', async () => {
      const rows = await adminTable().all();
      expect(rows).toHaveLength(6);
      assertIncludesNonPublished(rows);
    });

    it('should let editor see all rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(editor));
      const rows = await table.all();
      expect(rows).toHaveLength(6);
      assertIncludesNonPublished(rows);
    });

    it('should let collaborator see published and permitted rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual([
        'ent-group-read',
        'ent-group-write',
        'ent-pub',
        'ent-read',
        'ent-write',
      ]);
      assertIncludesNonPublished(rows);
    });

    it('should let anonymous see only published rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table.all();
      const ids = rows.map(r => r._id);
      expect(ids).toEqual(['ent-pub']);
      expect(rows.every(r => r.published)).toBe(true);
    });

    it('should let system bypass see all rows', async () => {
      const table = createEnforcedTable(AccessContext.system());
      const rows = await table.all();
      expect(rows).toHaveLength(6);
      assertIncludesNonPublished(rows);
    });
  });

  describe('write enforcement — update', () => {
    it('should let collaborator update a writable row', async () => {
      const before = await adminTable().where({ _id: 'ent-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-write' }).update({ name: 'updated' });
      expect(ids).toEqual(['ent-write']);

      const after = await adminTable().where({ _id: 'ent-write' }).first();
      expect(after!.name).toBe('updated');
    });

    it('should not let collaborator update a read-only row', async () => {
      const before = await adminTable().where({ _id: 'ent-read' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-read' }).update({ name: 'updated' });
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-read' }).first();
      expect(after!.name).toBe('private-read');
    });

    it('should not let collaborator update a row they have no access to', async () => {
      const before = await adminTable().where({ _id: 'ent-none' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-none' }).update({ name: 'updated' });
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-none' }).first();
      expect(after!.name).toBe('private-none');
    });

    it('should let admin update any row', async () => {
      const before = await adminTable().where({ _id: 'ent-none' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const ids = await adminTable().where({ _id: 'ent-none' }).update({ name: 'admin-updated' });
      expect(ids).toEqual(['ent-none']);

      const after = await adminTable().where({ _id: 'ent-none' }).first();
      expect(after!.name).toBe('admin-updated');
    });

    it('should not let anonymous update any row', async () => {
      const before = await adminTable().where({ _id: 'ent-pub' }).first();
      expect(before).toBeDefined();

      const table = createEnforcedTable(AccessContext.forActor(anon));
      const ids = await table.where({ _id: 'ent-pub' }).update({ name: 'updated' });
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-pub' }).first();
      expect(after!.name).toBe('published');
    });
  });

  describe('write enforcement — delete', () => {
    it('should let collaborator delete a writable row', async () => {
      const before = await adminTable().where({ _id: 'ent-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-write' }).delete();
      expect(ids).toEqual(['ent-write']);

      const after = await adminTable().where({ _id: 'ent-write' }).first();
      expect(after).toBeUndefined();
    });

    it('should not let collaborator delete a read-only row', async () => {
      const before = await adminTable().where({ _id: 'ent-read' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-read' }).delete();
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-read' }).first();
      expect(after).toBeDefined();
    });
  });

  describe('insert gate', () => {
    it('should let collaborator insert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.insert({ _id: 'ent-new', name: 'new-row', published: true, permissions: '[]' });

      const row = await adminTable().where({ _id: 'ent-new' }).first();
      expect(row).toBeDefined();
    });

    it('should not let anonymous insert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      await expect(
        table.insert({ _id: 'ent-new', name: 'new-row', published: false, permissions: '[]' })
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('should let system bypass insert', async () => {
      const table = createEnforcedTable(AccessContext.system());
      await table.insert({ _id: 'ent-sys', name: 'sys-row', published: false, permissions: '[]' });

      const row = await adminTable().where({ _id: 'ent-sys' }).first();
      expect(row).toBeDefined();
    });
  });

  describe('upsert', () => {
    it('should let collaborator upsert a writable row (update path)', async () => {
      const before = await adminTable().where({ _id: 'ent-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.upsert({
        _id: 'ent-write',
        name: 'upserted',
        published: false,
        permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'write' }]),
      });

      const after = await adminTable().where({ _id: 'ent-write' }).first();
      expect(after!.name).toBe('upserted');
    });

    it('should silently no-op when collaborator upserts a read-only row', async () => {
      const before = await adminTable().where({ _id: 'ent-none' }).first();
      expect(before).toBeDefined();
      expect(before!.name).toBe('private-none');
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.upsert({
        _id: 'ent-none',
        name: 'hacked',
        published: false,
        permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'write' }]),
      });

      const after = await adminTable().where({ _id: 'ent-none' }).first();
      expect(after!.name).toBe('private-none');
    });

    it('should let admin upsert any row', async () => {
      const before = await adminTable().where({ _id: 'ent-none' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      await adminTable().upsert({
        _id: 'ent-none',
        name: 'admin-upserted',
        published: false,
        permissions: '[]',
      });

      const after = await adminTable().where({ _id: 'ent-none' }).first();
      expect(after!.name).toBe('admin-upserted');
    });

    it('should not let anonymous upsert', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      await expect(
        table.upsert({ _id: 'ent-upsert-anon', name: 'nope', published: true, permissions: '[]' })
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('group permissions — read', () => {
    it('should let collaborator read entity with group read permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-read' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table.where({ _id: 'ent-group-read' }).first();
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-group-read');
    });

    it('should let collaborator read entity with group write permission (write implies read)', async () => {
      const before = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const row = await table.where({ _id: 'ent-group-write' }).first();
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-group-write');
    });

    it('should not let otherUser read group-only entities', async () => {
      const before = await adminTable().where({ _id: 'ent-group-read' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(otherUser));
      const rows = await table
        .whereIn('_id', ['ent-group-read', 'ent-group-write', 'ent-pub'])
        .all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub']);

      const after = await adminTable().whereIn('_id', ['ent-group-read', 'ent-group-write']).all();
      expect(after).toHaveLength(2);
    });
  });

  describe('group permissions — write', () => {
    it('should let collaborator update entity with group write permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-group-write' }).update({ name: 'updated-group' });
      expect(ids).toEqual(['ent-group-write']);

      const after = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(after!.name).toBe('updated-group');
    });

    it('should not let collaborator update entity with only group read permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-read' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table.where({ _id: 'ent-group-read' }).update({ name: 'hacked' });
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-group-read' }).first();
      expect(after!.name).toBe('group-read-only');
    });

    it('should not let otherUser update entity with group write permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(otherUser));
      const ids = await table.where({ _id: 'ent-group-write' }).update({ name: 'hacked' });
      expect(ids).toEqual([]);

      const after = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(after!.name).toBe('group-write-only');
    });
  });

  describe('group permissions — upsert', () => {
    it('should let collaborator upsert row with group write permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(before).toBeDefined();
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      await table.upsert({
        _id: 'ent-group-write',
        name: 'upserted-group',
        published: false,
        permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'write' }]),
      });

      const after = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(after!.name).toBe('upserted-group');
    });

    it('should not let otherUser upsert row with group write permission', async () => {
      const before = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(before).toBeDefined();
      expect(before!.name).toBe('group-write-only');
      expect(before!.published).toBe(false);

      const table = createEnforcedTable(AccessContext.forActor(otherUser));
      await table.upsert({
        _id: 'ent-group-write',
        name: 'hacked-group',
        published: false,
        permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'write' }]),
      });

      const after = await adminTable().where({ _id: 'ent-group-write' }).first();
      expect(after!.name).toBe('group-write-only');
    });
  });

  describe('regression — OR does not bypass enforcement', () => {
    it('should not leak unreadable rows via orWhere', async () => {
      const adminRows = await adminTable().whereIn('_id', ['ent-read', 'ent-none']).all();
      expect(adminRows).toHaveLength(2);
      expect(adminRows.every(r => !r.published)).toBe(true);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.where({ _id: 'ent-read' }).orWhere({ _id: 'ent-none' }).all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });

    it('should not leak unwritable rows via orWhere', async () => {
      const adminRows = await adminTable().whereIn('_id', ['ent-write', 'ent-read']).all();
      expect(adminRows).toHaveLength(2);
      expect(adminRows.every(r => !r.published)).toBe(true);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .where({ _id: 'ent-write' })
        .orWhere({ _id: 'ent-read' })
        .update({ name: 'hacked' });
      expect(ids).toEqual(['ent-write']);

      const after = await adminTable().where({ _id: 'ent-read' }).first();
      expect(after!.name).toBe('private-read');
    });

    it('should not leak unreadable rows via whereRaw with OR', async () => {
      const adminRows = await adminTable().whereIn('_id', ['ent-read', 'ent-none']).all();
      expect(adminRows).toHaveLength(2);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.whereRaw("_id = 'ent-none' OR _id = 'ent-read'").all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });

    it('should not leak unwritable rows via whereRaw with OR', async () => {
      const adminRows = await adminTable().whereIn('_id', ['ent-write', 'ent-read']).all();
      expect(adminRows).toHaveLength(2);

      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const ids = await table
        .whereRaw("_id = 'ent-read' OR _id = 'ent-write'")
        .update({ name: 'hacked' });
      expect(ids).toEqual(['ent-write']);

      const after = await adminTable().where({ _id: 'ent-read' }).first();
      expect(after!.name).toBe('private-read');
    });

    it('should not leak rows via whereExists subquery', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .whereExists(function (this: Knex.QueryBuilder) {
          this.select('*').from(TEST_TABLE).whereRaw('1=1');
        })
        .all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual([
        'ent-group-read',
        'ent-group-write',
        'ent-pub',
        'ent-read',
        'ent-write',
      ]);
      assertIncludesNonPublished(rows);
    });
  });
});
