/* eslint-disable max-statements */
import { Db, Filter } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '../getConnectionForCurrentTenant.js';
import { MongoPermissionEnforcedCollection } from '../MongoPermissionEnforcedCollection.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';
import type { MongoPermissionTranslator } from '../MongoPermissionTranslator.js';

// ── Test collection ───────────────────────────────────────────────────────────

const TEST_COLLECTION = 'permission_test';

type TestDoc = {
  _id: string;
  name: string;
  published: boolean;
  permissions: { refId: string; type: string; level: string }[];
};

// ── Test translator ─────────────────────────────────────────────────────────

class TestPermissionTranslator implements MongoPermissionTranslator {
  applyReadCondition(filter: Filter<any>, ac: AccessContext): Filter<any> {
    if (ac.isPrivileged()) return filter;
    if (ac.isAnonymous()) {
      if (Object.keys(filter).length === 0) return { published: true };
      return { $and: [filter, { published: true }] };
    }

    const readPerm = {
      $or: [
        { published: true },
        { permissions: { $elemMatch: { refId: { $in: ac.refIds } } } },
      ],
    };

    if (Object.keys(filter).length === 0) return readPerm;
    return { $and: [filter, readPerm] };
  }

  applyWriteCondition(filter: Filter<any>, ac: AccessContext): Filter<any> {
    if (ac.isPrivileged()) return filter;
    if (ac.isAnonymous()) return { _id: null };

    const writePerm = {
      permissions: { $elemMatch: { refId: { $in: ac.refIds }, level: 'write' } },
    };

    if (Object.keys(filter).length === 0) return writePerm;
    return { $and: [filter, writePerm] };
  }
}

const createEnforcedCollection = (accessContext: AccessContext, db: Db) =>
  MongoPermissionEnforcedCollection.for<TestDoc>({
    collection: db.collection<TestDoc>(TEST_COLLECTION),
    accessContext,
    translator: new TestPermissionTranslator(),
  });

// ── Test actors ─────────────────────────────────────────────────────────────

const admin = new User('admin-1', 'admin', []);
const editor = new User('editor-1', 'editor', []);
const collaborator = new User('collab-1', 'collaborator', ['group-a']);
const otherUser = new User('other-1', 'collaborator', []);
const anon = User.createFrom(null);

// ── Fixtures ────────────────────────────────────────────────────────────────

const fixtures: TestDoc[] = [
  { _id: 'ent-pub', name: 'published', published: true, permissions: [] },
  {
    _id: 'ent-write',
    name: 'private-write',
    published: false,
    permissions: [
      { refId: 'collab-1', type: 'user', level: 'write' },
      { refId: 'group-a', type: 'group', level: 'read' },
    ],
  },
  {
    _id: 'ent-read',
    name: 'private-read',
    published: false,
    permissions: [{ refId: 'collab-1', type: 'user', level: 'read' }],
  },
  {
    _id: 'ent-none',
    name: 'private-none',
    published: false,
    permissions: [{ refId: 'other-1', type: 'user', level: 'write' }],
  },
  {
    _id: 'ent-group-read',
    name: 'group-read-only',
    published: false,
    permissions: [{ refId: 'group-a', type: 'group', level: 'read' }],
  },
  {
    _id: 'ent-group-write',
    name: 'group-write-only',
    published: false,
    permissions: [{ refId: 'group-a', type: 'group', level: 'write' }],
  },
];

const insertFixtures = async (db: Db) => {
  await db.collection<TestDoc>(TEST_COLLECTION).insertMany(fixtures);
};

// ── Setup / teardown ─────────────────────────────────────────────────────────

let db: Db;

beforeAll(async () => {
  await testingEnvironment.setUp({});
  db = getConnection();
  await db.createCollection(TEST_COLLECTION);
});

beforeEach(async () => {
  await db.collection(TEST_COLLECTION).deleteMany({});
  await insertFixtures(db);
});

afterAll(async () => {
  await db.dropCollection(TEST_COLLECTION);
  await testingEnvironment.tearDown();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('MongoPermissionEnforcedCollection', () => {
  describe('find() — read enforcement', () => {
    it('admin sees all rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(admin), db);
      const rows = await coll.find({}).toArray();
      expect(rows).toHaveLength(6);
    });

    it('editor sees all rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(editor), db);
      const rows = await coll.find({}).toArray();
      expect(rows).toHaveLength(6);
    });

    it('collaborator sees published + rows where they are in permissions', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll.find({}).toArray();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual([
        'ent-group-read',
        'ent-group-write',
        'ent-pub',
        'ent-read',
        'ent-write',
      ]);
    });

    it('anonymous sees only published rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      const rows = await coll.find({}).toArray();
      const ids = rows.map(r => r._id);
      expect(ids).toEqual(['ent-pub']);
    });

    it('system bypass sees all rows', async () => {
      const coll = createEnforcedCollection(AccessContext.system(), db);
      const rows = await coll.find({}).toArray();
      expect(rows).toHaveLength(6);
    });
  });

  describe('findOne() — read enforcement', () => {
    it('collaborator can findOne a row they have read access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne({ _id: 'ent-read' });
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-read');
    });

    it('collaborator gets null when findOne on a row they cannot read', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne({ _id: 'ent-none' });
      expect(row).toBeNull();
    });
  });

  describe('countDocuments() — read enforcement', () => {
    it('collaborator count excludes inaccessible rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const n = await coll.countDocuments();
      expect(n).toBe(5);
    });

    it('anonymous count only includes published rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      const n = await coll.countDocuments();
      expect(n).toBe(1);
    });
  });

  describe('updateOne() — write enforcement', () => {
    it('collaborator can update a row they have write access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne({ _id: 'ent-write' }, { $set: { name: 'updated' } });
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
    });

    it('collaborator cannot update a row they only have read access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne({ _id: 'ent-read' }, { $set: { name: 'updated' } });
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('collaborator cannot update a row they have no access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne({ _id: 'ent-none' }, { $set: { name: 'updated' } });
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('admin can update any row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(admin), db);
      const result = await coll.updateOne({ _id: 'ent-none' }, { $set: { name: 'updated' } });
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
    });

    it('anonymous cannot update any row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      const result = await coll.updateOne({ _id: 'ent-pub' }, { $set: { name: 'updated' } });
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });
  });

  describe('updateMany() — write enforcement', () => {
    it('updateMany with $in only modifies writable rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateMany(
        { _id: { $in: ['ent-write', 'ent-read', 'ent-none'] } },
        { $set: { name: 'batch-updated' } },
      );
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);

      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const rows = await adminColl.find({ name: 'batch-updated' }).toArray();
      expect(rows.map(r => r._id)).toEqual(['ent-write']);
    });
  });

  describe('deleteOne() — write enforcement', () => {
    it('collaborator can delete a row they have write access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.deleteOne({ _id: 'ent-write' });
      expect(result.deletedCount).toBe(1);
    });

    it('collaborator cannot delete a row they only have read access to', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.deleteOne({ _id: 'ent-read' });
      expect(result.deletedCount).toBe(0);
    });
  });

  describe('deleteMany() — write enforcement', () => {
    it('deleteMany with $in only deletes writable rows', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.deleteMany({ _id: { $in: ['ent-write', 'ent-read', 'ent-none'] } });
      expect(result.deletedCount).toBe(1);

      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const rows = await adminColl.find({ _id: 'ent-write' }).toArray();
      expect(rows).toHaveLength(0);
    });
  });

  describe('insertOne() — gate check', () => {
    it('collaborator can insert', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      await coll.insertOne({ _id: 'ent-new', name: 'new-row', published: true, permissions: [] });
      const row = await coll.findOne({ _id: 'ent-new' });
      expect(row).toBeDefined();
    });

    it('anonymous cannot insert', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.insertOne({ _id: 'ent-new', name: 'new-row', published: false, permissions: [] }),
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('system bypass can insert', async () => {
      const coll = createEnforcedCollection(AccessContext.system(), db);
      await coll.insertOne({ _id: 'ent-sys', name: 'sys-row', published: false, permissions: [] });
      const row = await coll.findOne({ _id: 'ent-sys' });
      expect(row).toBeDefined();
    });
  });

  describe('insertMany() — gate check', () => {
    it('anonymous cannot insertMany', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.insertMany([{ _id: 'ent-new', name: 'new-row', published: false, permissions: [] }]),
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('upsert via updateOne with upsert:true', () => {
    it('collaborator can upsert (insert path)', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-upsert-new' },
        { $set: { name: 'upserted', published: true, permissions: [] } },
        { upsert: true },
      );
      expect(result.upsertedCount).toBe(1);
      const row = await coll.findOne({ _id: 'ent-upsert-new' });
      expect(row!.name).toBe('upserted');
    });

    it('collaborator can upsert (update path — existing row)', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-write' },
        { $set: { name: 'upserted-name' } },
        { upsert: true },
      );
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
      const row = await coll.findOne({ _id: 'ent-write' });
      expect(row!.name).toBe('upserted-name');
    });

    it('collaborator cannot upsert a row they do not have write access to', async () => {
      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const before = await adminColl.findOne({ _id: 'ent-none' });
      expect(before!.name).toBe('private-none');

      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-none' },
        { $set: { name: 'hacked' } },
        { upsert: true },
      );
      expect(result.matchedCount).toBe(0);
      expect(result.upsertedCount).toBe(0);

      const after = await adminColl.findOne({ _id: 'ent-none' });
      expect(after!.name).toBe('private-none');
    });
    it('anonymous upsert without _id is blocked', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.updateOne(
          { name: 'not-found' },
          { $set: { name: 'injected', published: true, permissions: [] } },
          { upsert: true },
        ),
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('upsert via updateMany with upsert:true', () => {
    it('anonymous updateMany upsert without _id is blocked', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.updateMany(
          { name: 'not-found' },
          { $set: { name: 'injected', published: true, permissions: [] } },
          { upsert: true },
        ),
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('findOneAndUpdate() — write enforcement', () => {
    it('collaborator can findOneAndUpdate a writable row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndUpdate(
        { _id: 'ent-write' },
        { $set: { name: 'updated' } },
      );
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-write');
    });

    it('collaborator cannot findOneAndUpdate a read-only row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndUpdate(
        { _id: 'ent-read' },
        { $set: { name: 'hacked' } },
      );
      expect(row).toBeNull();
    });
    it('anonymous findOneAndUpdate upsert without _id is blocked', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.findOneAndUpdate(
          { name: 'not-found' },
          { $set: { name: 'injected', published: true, permissions: [] } },
          { upsert: true },
        ),
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('findOneAndDelete() — write enforcement', () => {
    it('collaborator can findOneAndDelete a writable row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndDelete({ _id: 'ent-write' });
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-write');
    });

    it('collaborator cannot findOneAndDelete a read-only row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndDelete({ _id: 'ent-read' });
      expect(row).toBeNull();
    });
  });

  describe('findOneAndReplace() — write enforcement', () => {
    it('collaborator can findOneAndReplace a writable row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndReplace(
        { _id: 'ent-write' },
        { name: 'replaced', published: false, permissions: [] } as any,
      );
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-write');
    });

    it('collaborator cannot findOneAndReplace a read-only row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndReplace(
        { _id: 'ent-read' },
        { name: 'hacked', published: false, permissions: [] } as any,
      );
      expect(row).toBeNull();
    });

    it('findOneAndReplace with upsert:true respects write permission on existing doc', async () => {
      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const before = await adminColl.findOne({ _id: 'ent-group-read' });
      expect(before!.name).toBe('group-read-only');

      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOneAndReplace(
        { _id: 'ent-group-read' },
        { name: 'hacked', published: false, permissions: [] } as any,
        { upsert: true },
      );
      expect(row).toBeNull();

      const after = await adminColl.findOne({ _id: 'ent-group-read' });
      expect(after!.name).toBe('group-read-only');
    });
  });

  describe('replaceOne() — write enforcement', () => {
    it('collaborator can replaceOne a writable row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.replaceOne(
        { _id: 'ent-write' },
        { name: 'replaced', published: false, permissions: [] } as any,
      );
      expect(result.modifiedCount).toBe(1);
    });

    it('collaborator cannot replaceOne a read-only row', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.replaceOne(
        { _id: 'ent-read' },
        { name: 'hacked', published: false, permissions: [] } as any,
      );
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });
    it('anonymous replaceOne upsert without _id is blocked', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.replaceOne(
          { name: 'not-found' },
          { name: 'injected', published: true, permissions: [] } as any,
          { upsert: true },
        ),
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('anonymous findOneAndReplace upsert without _id is blocked', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.findOneAndReplace(
          { name: 'not-found' },
          { name: 'injected', published: true, permissions: [] } as any,
          { upsert: true },
        ),
      ).rejects.toThrow('Anonymous users cannot insert');
    });
  });

  describe('bulkWrite() — permission enforcement', () => {
    it('anonymous cannot bulkWrite', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(anon), db);
      await expect(
        coll.bulkWrite([
          {
            insertOne: { document: { _id: 'ent-new', name: 'new', published: true, permissions: [] } },
          },
        ]),
      ).rejects.toThrow('Anonymous users cannot insert');
    });

    it('bulkWrite updateOne applies write permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.bulkWrite([
        { updateOne: { filter: { _id: 'ent-write' }, update: { $set: { name: 'bw-updated' } } } },
        { updateOne: { filter: { _id: 'ent-read' }, update: { $set: { name: 'bw-hacked' } } } },
      ]);
      expect(result.modifiedCount).toBe(1);

      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const rows = await adminColl.find({ name: 'bw-updated' }).toArray();
      expect(rows.map(r => r._id)).toEqual(['ent-write']);
    });

    it('bulkWrite deleteOne applies write permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.bulkWrite([
        { deleteOne: { filter: { _id: 'ent-write' } } },
        { deleteOne: { filter: { _id: 'ent-read' } } },
      ]);
      expect(result.deletedCount).toBe(1);
    });
  });

  describe('$or safety — read enforcement', () => {
    it('OR in find does not bypass read enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll
        .find({ $or: [{ _id: 'ent-none' }, { _id: 'ent-read' }] })
        .toArray();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });

    it('OR in updateOne does not bypass write enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { $or: [{ _id: 'ent-read' }, { _id: 'ent-write' }] },
        { $set: { name: 'hacked' } },
      );
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);

      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const updated = await adminColl.find({ name: 'hacked' }).toArray();
      expect(updated.map(r => r._id)).toEqual(['ent-write']);
    });

    it('OR in deleteMany does not bypass write enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.deleteMany({
        $or: [{ _id: 'ent-read' }, { _id: 'ent-write' }],
      });
      expect(result.deletedCount).toBe(1);
    });
  });

  describe('select + orderBy equivalents', () => {
    it('find with projection preserves permission enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne(
        { _id: 'ent-write' },
        { projection: { _id: 1, name: 1 } },
      );
      expect(row).toBeDefined();
      expect(row!).toHaveProperty('_id');
      expect(row!).toHaveProperty('name');
      expect(row!).not.toHaveProperty('published');
      expect(row!).not.toHaveProperty('permissions');
    });

    it('find with sort and cursor chain preserves permission enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(admin), db);
      const rows = await coll.find({}, { projection: { _id: 1, name: 1 } }).sort({ name: 1 }).toArray();
      const names = rows.map(r => r.name);
      expect(names).toEqual([
        'group-read-only',
        'group-write-only',
        'private-none',
        'private-read',
        'private-write',
        'published',
      ]);
    });

    it('find with limit skips unreadable rows first', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll.find({}).sort({ _id: 1 }).limit(1).toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]._id).toBe('ent-group-read');
    });

    it('find with skip and limit after permission filtering', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll.find({}).sort({ _id: 1 }).skip(1).limit(10).toArray();
      expect(rows.map(r => r._id)).toEqual([
        'ent-group-write',
        'ent-pub',
        'ent-read',
        'ent-write',
      ]);
    });
  });

  describe('distinct() — read enforcement', () => {
    it('distinct does not bypass read enforcement', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const vals = await coll.distinct('published');
      expect(vals.sort()).toEqual([false, true]);
    });
  });

  describe('aggregate() — read enforcement', () => {
    it('aggregate prepends permission $match and does not bypass', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll
        .aggregate([{ $match: { _id: { $in: ['ent-none', 'ent-read'] } } }])
        .toArray();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-read']);
    });
  });

  describe('edge cases — empty results', () => {
    it('find returns [] when all matched rows are unreadable', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll.find({ _id: 'ent-none' }).toArray();
      expect(rows).toEqual([]);
    });

    it('findOne returns null when all matched rows are unreadable', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne({ _id: 'ent-none' });
      expect(row).toBeNull();
    });

    it('countDocuments returns 0 when all matched rows are unreadable', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const n = await coll.countDocuments({ _id: 'ent-none' } as any);
      expect(n).toBe(0);
    });
  });

  describe('group permissions — read enforcement', () => {
    it('collaborator can read an entity with only group read permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne({ _id: 'ent-group-read' });
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-group-read');
    });

    it('collaborator can read an entity with only group write permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const row = await coll.findOne({ _id: 'ent-group-write' });
      expect(row).toBeDefined();
      expect(row!._id).toBe('ent-group-write');
    });

    it('otherUser (not in group) cannot read group-only entities', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(otherUser), db);
      const rows = await coll
        .find({ _id: { $in: ['ent-group-read', 'ent-group-write', 'ent-pub'] } })
        .toArray();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-pub']);
    });

    it('group permissions work with $or filter', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const rows = await coll
        .find({ $or: [{ _id: 'ent-group-read' }, { _id: 'ent-none' }] })
        .toArray();
      const ids = rows.map(r => r._id).sort();
      expect(ids).toEqual(['ent-group-read']);
    });
  });

  describe('group permissions — write enforcement', () => {
    it('collaborator can update an entity with group write permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-write' },
        { $set: { name: 'updated' } },
      );
      expect(result.modifiedCount).toBe(1);
    });

    it('collaborator cannot update an entity with only group read permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-read' },
        { $set: { name: 'updated' } },
      );
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('otherUser cannot update a group-write entity', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(otherUser), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-write' },
        { $set: { name: 'hacked' } },
      );
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('otherUser cannot delete a group-write entity', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(otherUser), db);
      const result = await coll.deleteOne({ _id: 'ent-group-write' });
      expect(result.deletedCount).toBe(0);
    });
  });

  describe('group permissions — upsert', () => {
    it('collaborator can upsert an existing entity with group write permission', async () => {
      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-write' },
        { $set: { name: 'group-write-updated' } },
        { upsert: true },
      );
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
      const row = await coll.findOne({ _id: 'ent-group-write' });
      expect(row!.name).toBe('group-write-updated');
    });

    it('collaborator cannot upsert an existing entity with only group read permission', async () => {
      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const before = await adminColl.findOne({ _id: 'ent-group-read' });
      expect(before!.name).toBe('group-read-only');

      const coll = createEnforcedCollection(AccessContext.forActor(collaborator), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-read' },
        { $set: { name: 'hacked' } },
        { upsert: true },
      );
      expect(result.matchedCount).toBe(0);
      expect(result.upsertedCount).toBe(0);

      const after = await adminColl.findOne({ _id: 'ent-group-read' });
      expect(after!.name).toBe('group-read-only');
    });

    it('otherUser cannot upsert a row with group write permission', async () => {
      const adminColl = createEnforcedCollection(AccessContext.forActor(admin), db);
      const before = await adminColl.findOne({ _id: 'ent-group-write' });
      expect(before!.name).toBe('group-write-only');

      const coll = createEnforcedCollection(AccessContext.forActor(otherUser), db);
      const result = await coll.updateOne(
        { _id: 'ent-group-write' },
        { $set: { name: 'hacked' } },
        { upsert: true },
      );
      expect(result.matchedCount).toBe(0);
      expect(result.upsertedCount).toBe(0);

      const after = await adminColl.findOne({ _id: 'ent-group-write' });
      expect(after!.name).toBe('group-write-only');
    });
  });
});
