import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures, ids } from './fixtures.js';

let db: Db | null;

const clearContextValidator = async () => {
  await db!.command({
    collMod: 'translationsV2',
    validator: {},
    validationLevel: 'off',
  });
};

const seed = async () => {
  await clearContextValidator();
  await Promise.all([
    db!.collection('translationsV2').deleteMany({}),
    db!.collection('templates').deleteMany({}),
    db!.collection('dictionaries').deleteMany({}),
    db!.collection('relationtypes').deleteMany({}),
  ]);
  await Promise.all([
    db!.collection('translationsV2').insertMany(fixtures.translationsV2),
    db!.collection('templates').insertMany(fixtures.templates),
    db!.collection('dictionaries').insertMany(fixtures.dictionaries),
    db!.collection('relationtypes').insertMany(fixtures.relationtypes),
  ]);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('205-backfill-translation-context', () => {
  beforeEach(async () => {
    await seed();
  });

  it('should have expected metadata', () => {
    expect(migration.delta).toBe(205);
    expect(migration.reindex).toBe(false);
    expect(migration.requiresSchema).toBe(15);
  });

  it('should copy type and label from a complete sibling in the same context', async () => {
    await migration.up(db!);

    const incomplete = await db!
      .collection('translationsV2')
      .findOne({ _id: ids.incompleteSystemEs });
    expect(incomplete?.context).toEqual({
      id: 'System',
      type: 'Uwazi UI',
      label: 'User Interface',
    });
  });

  it('should restore context from templates, thesauri and relationship types', async () => {
    await migration.up(db!);

    const [templateRow, thesaurusRow, relationRow] = await Promise.all([
      db!.collection('translationsV2').findOne({ _id: ids.incompleteTemplate }),
      db!.collection('translationsV2').findOne({ _id: ids.incompleteThesaurus }),
      db!.collection('translationsV2').findOne({ _id: ids.incompleteRelationType }),
    ]);

    expect(templateRow?.context).toEqual({
      id: ids.template.toHexString(),
      type: 'Entity',
      label: 'Case',
    });
    expect(thesaurusRow?.context).toEqual({
      id: ids.thesaurus.toHexString(),
      type: 'Thesaurus',
      label: 'Countries',
    });
    expect(relationRow?.context).toEqual({
      id: ids.relationType.toHexString(),
      type: 'Relationship Type',
      label: 'Related to',
    });
  });

  it('should default known UI contexts when no sibling exists', async () => {
    await migration.up(db!);

    const row = await db!.collection('translationsV2').findOne({ _id: ids.incompleteFilters });
    expect(row?.context).toEqual({
      id: 'Filters',
      type: 'Uwazi UI',
      label: 'Filters',
    });
  });

  it('should leave complete documents unchanged and be idempotent', async () => {
    await migration.up(db!);
    await migration.up(db!);

    const row = await db!.collection('translationsV2').findOne({ _id: ids.completeCustomLabel });
    expect(row?.context).toEqual({
      id: 'Menu',
      type: 'Uwazi UI',
      label: 'Interface',
    });
  });

  it('should reject later inserts that omit context type or label', async () => {
    await migration.up(db!);

    await expect(
      db!.collection('translationsV2').insertOne({
        language: 'en',
        key: 'New',
        value: 'New',
        context: { id: 'System' },
      })
    ).rejects.toThrow();
  });
});
