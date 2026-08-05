import { Db, ObjectId } from 'mongodb';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

const legacyOnlyFileId = new ObjectId();
const bothFieldsFileId = new ObjectId();
const noLegacyFileId = new ObjectId();

const fixture: DBFixture = {
  files: [
    {
      _id: legacyOnlyFileId,
      entity: 'entity_legacy_only',
      type: 'document',
      filename: 'legacy_only.pdf',
      extractedMetadata: [{ name: 'title', selection: { text: 'legacy title' } }],
    } as any,
    {
      _id: bothFieldsFileId,
      entity: 'entity_both_fields',
      type: 'document',
      filename: 'both_fields.pdf',
      extractedMetadata: [
        { name: 'title', selection: { text: 'legacy value' } },
        { name: 'summary', selection: { text: 'legacy summary' } },
      ],
      propertySelections: [{ name: 'title', selection: { text: 'new value' } }],
    } as any,
    {
      _id: noLegacyFileId,
      entity: 'entity_no_legacy',
      type: 'document',
      filename: 'no_legacy.pdf',
      propertySelections: [{ name: 'summary', selection: { text: 'already new' } }],
    } as any,
  ],
};

const setUpAndRun = async (currentFixture: DBFixture) => {
  await testingDB.setupFixturesAndContext(currentFixture);
  db = testingDB.mongodb;
  await migration.up(db!);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('194-rename-extracted-metadata-to-property-selections', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(194);
    expect(migration.reindex).toBe(false);
  });

  it('copies legacy selections when missing and merges safely when propertySelections exists', async () => {
    await setUpAndRun(fixture);

    const legacyOnlyFile = await db!.collection('files').findOne({ _id: legacyOnlyFileId });
    expect(legacyOnlyFile?.propertySelections).toEqual([
      { name: 'title', selection: { text: 'legacy title' } },
    ]);

    const bothFieldsFile = await db!.collection('files').findOne({ _id: bothFieldsFileId });
    expect(bothFieldsFile?.propertySelections).toEqual([
      { name: 'title', selection: { text: 'new value' } },
      { name: 'summary', selection: { text: 'legacy summary' } },
    ]);
  });

  it('removes extractedMetadata and keeps docs without legacy field untouched', async () => {
    const legacyOnlyFile = await db!.collection('files').findOne({ _id: legacyOnlyFileId });
    const bothFieldsFile = await db!.collection('files').findOne({ _id: bothFieldsFileId });
    const noLegacyFile = await db!.collection('files').findOne({ _id: noLegacyFileId });

    expect(legacyOnlyFile?.extractedMetadata).toBeUndefined();
    expect(bothFieldsFile?.extractedMetadata).toBeUndefined();
    expect(noLegacyFile?.propertySelections).toEqual([
      { name: 'summary', selection: { text: 'already new' } },
    ]);
    expect(noLegacyFile?.extractedMetadata).toBeUndefined();
  });

  it('should not fail when files collection does not exist', async () => {
    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb;
    await db!.collection('files').drop();

    await expect(migration.up(db!)).resolves.toBeUndefined();
    expect(migration.reindex).toBe(false);
  });
});
