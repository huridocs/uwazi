import type { Knex } from 'knex';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTransactionManager } from '../PostgresTransactionManager.js';
import { PostgresPermissionEnforcedTable } from '../PostgresPermissionEnforcedTable.js';
import { PostgresTable } from '../PostgresTable.js';
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
  value: number;
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

const fixtures: Array<{
  _id: string;
  name: string;
  published: boolean;
  permissions: string;
  value: number;
}> = [
  { _id: 'ent-pub', name: 'published', published: true, permissions: '[]', value: 10 },
  {
    _id: 'ent-write',
    name: 'private-write',
    published: false,
    permissions: JSON.stringify([
      { refId: 'collab-1', type: 'user', level: 'write' },
      { refId: 'group-a', type: 'group', level: 'read' },
    ]),
    value: 20,
  },
  {
    _id: 'ent-read',
    name: 'private-read',
    published: false,
    permissions: JSON.stringify([{ refId: 'collab-1', type: 'user', level: 'read' }]),
    value: 30,
  },
  {
    _id: 'ent-none',
    name: 'private-none',
    published: false,
    permissions: JSON.stringify([{ refId: 'other-1', type: 'user', level: 'write' }]),
    value: 40,
  },
  {
    _id: 'ent-group-read',
    name: 'group-read-only',
    published: false,
    permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'read' }]),
    value: 50,
  },
  {
    _id: 'ent-group-write',
    name: 'group-write-only',
    published: false,
    permissions: JSON.stringify([{ refId: 'group-a', type: 'group', level: 'write' }]),
    value: 60,
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
      "value"       INTEGER NOT NULL DEFAULT 0,
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

  describe('permissions data stripping (safe by default)', () => {
    it('collaborator keeps permissions only on rows they can write to', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.all();
      const byId = new Map(rows.map(r => [r._id, r]));
      // write grant -> full array kept
      expect(byId.get('ent-write')!.permissions).toEqual([
        { refId: 'collab-1', type: 'user', level: 'write' },
        { refId: 'group-a', type: 'group', level: 'read' },
      ]);
      expect(byId.get('ent-group-write')!.permissions).toEqual([
        { refId: 'group-a', type: 'group', level: 'write' },
      ]);
      // read-only grant -> permissions stripped
      expect(byId.get('ent-read')!.permissions).toBeUndefined();
      expect(byId.get('ent-group-read')!.permissions).toBeUndefined();
      // published without any grant -> permissions stripped
      expect(byId.get('ent-pub')!.permissions).toBeUndefined();
    });

    it('anonymous never sees permissions', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows = await table.all();
      rows.forEach(r => expect(r.permissions).toBeUndefined());
    });

    it('admin keeps permissions', async () => {
      const rows = await adminTable().all();
      expect(rows.find(r => r._id === 'ent-write')!.permissions).toEqual([
        { refId: 'collab-1', type: 'user', level: 'write' },
        { refId: 'group-a', type: 'group', level: 'read' },
      ]);
    });

    it('system bypass keeps permissions', async () => {
      const table = createEnforcedTable(AccessContext.system());
      const rows = await table.all();
      expect(rows.find(r => r._id === 'ent-write')!.permissions).toEqual([
        { refId: 'collab-1', type: 'user', level: 'write' },
        { refId: 'group-a', type: 'group', level: 'read' },
      ]);
    });

    it('first() strips permissions for non-privileged actors', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const row = await table.where({ _id: 'ent-pub' }).first();
      expect(row).toBeDefined();
      expect(row!.permissions).toBeUndefined();

      const collaboratorTable = createEnforcedTable(AccessContext.forActor(collaborator));
      expect((await collaboratorTable.where({ _id: 'ent-write' }).first())!.permissions).toEqual([
        { refId: 'collab-1', type: 'user', level: 'write' },
        { refId: 'group-a', type: 'group', level: 'read' },
      ]);
      expect(
        (await collaboratorTable.where({ _id: 'ent-read' }).first())!.permissions
      ).toBeUndefined();
    });

    it('stream() strips permissions for non-privileged actors', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows: TestRow[] = [];
      for await (const row of table.stream()) {
        rows.push(row);
      }
      expect(rows.map(r => r._id)).toEqual(['ent-pub']);
      rows.forEach(r => expect(r.permissions).toBeUndefined());
    });
  });

  describe('read enforcement — count', () => {
    it('should count only visible rows for collaborator', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const n = await table.count();
      expect(n).toBe(5);
    });

    it('should count only published rows for anonymous', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const n = await table.count();
      expect(n).toBe(1);
    });

    it('should count all rows for admin', async () => {
      const n = await adminTable().count();
      expect(n).toBe(6);
    });
  });

  describe('read enforcement — sum', () => {
    it('should sum only visible rows for collaborator', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const total = await table.sum('value');
      // ent-pub(10) + ent-write(20) + ent-read(30) + ent-group-read(50) + ent-group-write(60)
      expect(total).toBe(170);
    });

    it('should sum only published rows for anonymous', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const total = await table.sum('value');
      expect(total).toBe(10);
    });

    it('should sum all rows for admin', async () => {
      const total = await adminTable().sum('value');
      expect(total).toBe(210);
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

  describe('stream — read enforcement', () => {
    it('should let admin stream all rows', async () => {
      const rows: TestRow[] = [];
      for await (const row of adminTable().stream()) {
        rows.push(row);
      }
      expect(rows).toHaveLength(6);
      assertIncludesNonPublished(rows);
    });

    it('should let collaborator stream only permitted rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows: TestRow[] = [];
      for await (const row of table.stream()) {
        rows.push(row);
      }
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

    it('should let anonymous stream only published rows', async () => {
      const table = createEnforcedTable(AccessContext.forActor(anon));
      const rows: TestRow[] = [];
      for await (const row of table.stream()) {
        rows.push(row);
      }
      const ids = rows.map(r => r._id);
      expect(ids).toEqual(['ent-pub']);
      expect(rows.every(r => r.published)).toBe(true);
    });

    it('should let system bypass stream all rows', async () => {
      const table = createEnforcedTable(AccessContext.system());
      const rows: TestRow[] = [];
      for await (const row of table.stream()) {
        rows.push(row);
      }
      expect(rows).toHaveLength(6);
      assertIncludesNonPublished(rows);
    });

    it('should respect where conditions with enforcement', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows: TestRow[] = [];
      for await (const row of table.where({ _id: 'ent-none' }).stream()) {
        rows.push(row);
      }
      // ent-none is not visible to collaborator
      expect(rows).toEqual([]);
    });

    it('should handle early break without hanging', async () => {
      const table = createEnforcedTable(AccessContext.forActor(admin));
      const rows: TestRow[] = [];
      for await (const row of table.stream()) {
        rows.push(row);
        if (rows.length === 3) break;
      }
      expect(rows).toHaveLength(3);
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

    it('should not leak unreadable rows via whereBetween', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.whereBetween('_id', ['ent-none', 'ent-read']).all();
      const ids = rows.map(r => r._id).sort();
      // ent-none is unreadable and must be excluded; ent-pub (published) and ent-read are visible.
      expect(ids).toEqual(['ent-pub', 'ent-read']);
    });

    it('should not leak unreadable rows via whereLike', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table.whereLike('name', '%-read').all();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });

    it('should not leak unreadable rows via having', async () => {
      const table = createEnforcedTable(AccessContext.forActor(collaborator));
      const rows = await table
        .select(['name'])
        .groupBy(['name'])
        .having('name', '=', 'private-none')
        .all();
      expect(rows).toEqual([]);
    });
  });

  describe('regression — concurrent operations on shared transaction manager', () => {
    it('should not leak permission context between concurrent operations', async () => {
      const sharedManager = managerFor(DEFAULT_TENANT);

      const adminEnforced = PostgresPermissionEnforcedTable.for<TestRow>({
        tableName: TEST_TABLE,
        tenantId: DEFAULT_TENANT,
        transactionManager: sharedManager,
        accessContext: AccessContext.forActor(admin),
      });

      const collabEnforced = PostgresPermissionEnforcedTable.for<TestRow>({
        tableName: TEST_TABLE,
        tenantId: DEFAULT_TENANT,
        transactionManager: sharedManager,
        accessContext: AccessContext.forActor(collaborator),
      });

      // Run concurrently — admin reads all, collaborator reads restricted.
      // With mutable permissionContext on the shared transaction manager,
      // the last setPermissionContext() call wins and both operations see
      // the same (wrong) view.
      const [adminRows, collabRows] = await Promise.all([
        adminEnforced.all(),
        collabEnforced.all(),
      ]);

      // Admin should see all 6 rows regardless of interleaving.
      expect(adminRows).toHaveLength(6);
      // Collaborator should see only their 5 permitted rows.
      expect(collabRows.map(r => r._id).sort()).toEqual([
        'ent-group-read',
        'ent-group-write',
        'ent-pub',
        'ent-read',
        'ent-write',
      ]);
    });
  });

  describe('regression — stored context leaks through transactionManager.run()', () => {
    it('should not leak permission context into an unrelated run() transaction', async () => {
      const sharedManager = managerFor(DEFAULT_TENANT);

      // A plain table inside run() has no way to set a permission context
      // (setPermissionContext and byPassPermissions are gone).  It should
      // always see only published rows — the safe default.
      await sharedManager.run(async () => {
        const innerTable = PostgresTable.for<TestRow>({
          tableName: TEST_TABLE,
          tenantId: DEFAULT_TENANT,
          transactionManager: sharedManager,
        });

        const rows = await innerTable.all();

        // A plain table with no bypass should only see published rows.
        expect(rows.map(r => r._id).sort()).toEqual(['ent-pub']);
      });
    });
  });
});
