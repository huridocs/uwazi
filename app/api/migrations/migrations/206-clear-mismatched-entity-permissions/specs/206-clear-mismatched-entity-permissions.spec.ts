import { Db } from 'mongodb';

import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Entity } from '../types.js';
import {
  fixtures,
  noMismatchesFixture,
  noBadGrantsFixture,
  adminId,
  collaboratorId,
  collaborator2Id,
  editorId,
  groupId,
} from './fixtures.js';

let db: Db | null;

const initTest = async (fixture: DBFixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
};

const getCopies = async (sharedId: string): Promise<Entity[]> => {
  const copies = await db!
    .collection('entities')
    .find({ sharedId })
    .sort({ language: 1 })
    .toArray();
  return copies as Entity[];
};

const getReqIds = (copy: Entity) => (copy.permissions ?? []).map(p => p.refId?.toString() ?? '');

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration clear-mismatched-entity-permissions', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(206);
  });

  describe('groups whose divergence is caused only by bad grants', () => {
    it.each([
      ['admin-grant', 'spurious admin grant'],
      ['deleted-user-grant', 'hard-deleted user grant'],
      ['commandid-grant', 'commandId sentinel grant'],
      ['soft-deleted-admin-grant', 'soft-deleted admin grant'],
      ['soft-deleted-collab-grant', 'soft-deleted collaborator grant'],
      ['string-refid-grant', 'legacy string-stored refId'],
    ])('should remove the %s (%s)', async (sharedId, _label) => {
      const copies = await getCopies(sharedId);
      expect(copies.length).toBeGreaterThan(1);
      copies.forEach(copy => expect(getReqIds(copy)).toEqual([]));
    });
  });

  it('should NOT remove a live non-admin (collaborator) grant', async () => {
    const copies = await getCopies('non-admin-grant');
    const zh = copies.find(c => c.language === 'zh')!;
    expect(getReqIds(zh)).toEqual([collaboratorId.toString()]);
  });

  it('should NOT remove a group grant', async () => {
    const copies = await getCopies('group-grant');
    const zh = copies.find(c => c.language === 'zh')!;
    expect(getReqIds(zh)).toEqual([groupId.toString()]);
    expect(zh.permissions![0].type).toBe('group');
  });

  it('should leave consistent (non-mismatched) groups untouched', async () => {
    const copies = await getCopies('consistent-admin');
    expect(copies).toHaveLength(3);
    copies.forEach(copy => expect(getReqIds(copy)).toEqual([adminId.toString()]));
  });

  it('should remove only the bad grant from a group that also has a legit collaborator grant', async () => {
    const copies = await getCopies('mixed-grants');
    const en = copies.find(c => c.language === 'en')!;
    const zh = copies.find(c => c.language === 'zh')!;

    expect(getReqIds(en)).toEqual([collaboratorId.toString()]);
    expect(getReqIds(zh)).toEqual([collaboratorId.toString()]);

    expect(en.permissions).toEqual(zh.permissions);
  });

  it('should remove a bad admin user grant but preserve a group grant in the same group', async () => {
    const copies = await getCopies('mixed-with-group');
    const en = copies.find(c => c.language === 'en')!;
    const zh = copies.find(c => c.language === 'zh')!;

    expect(getReqIds(en)).toEqual([groupId.toString()]);
    expect(getReqIds(zh)).toEqual([groupId.toString()]);
    expect(zh.permissions![0].type).toBe('group');
    expect(en.permissions).toEqual(zh.permissions);
  });

  it('should NOT remove a live editor grant (conservative: only known-bad refs are pulled)', async () => {
    const copies = await getCopies('live-editor-grant');
    const zh = copies.find(c => c.language === 'zh')!;
    expect(getReqIds(zh)).toEqual([editorId.toString()]);
  });

  it('should request a reindex because permissions were modified', () => {
    expect(migration.reindex).toBe(true);
  });
});

describe('migration clear-mismatched-entity-permissions with no mismatched groups', () => {
  beforeAll(async () => {
    await initTest(noMismatchesFixture);
  });

  it('should be a no-op and not request a reindex', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should leave the consistent copies untouched', async () => {
    const copies = await getCopies('consistent');
    expect(copies).toHaveLength(2);
    copies.forEach(copy => expect(getReqIds(copy)).toEqual([adminId.toString()]));
  });
});

describe('migration clear-mismatched-entity-permissions with no bad grants to remove', () => {
  beforeAll(async () => {
    await initTest(noBadGrantsFixture);
  });

  it('should be a no-op and not request a reindex', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should leave the legitimately divergent copies untouched', async () => {
    const copies = await getCopies('legit-diff');
    const en = copies.find(c => c.language === 'en')!;
    const zh = copies.find(c => c.language === 'zh')!;
    expect(getReqIds(en)).toEqual([collaboratorId.toString()]);
    expect(getReqIds(zh)).toEqual([collaborator2Id.toString()]);
  });
});
