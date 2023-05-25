import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration set_up_new_relationship_collection', () => {
  let db;

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(1);
  });

  it('should set up the relationships collection', async () => {
    const collections = await db.listCollections().toArray();
    const relCollection = collections.find(c => c.name === 'translations_v2');
    expect(relCollection).toBeDefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should set up the relationships collection with the correct indices', async () => {
    const indexInfo = await db.collection('translations_v2').indexInformation();
    expect(indexInfo).toEqual({
      _id_: [['_id', 1]],
      'language_1_key_1_context.id_1': [
        ['language', 1],
        ['key', 1],
        ['context.id', 1],
      ],
    });
  });

  it('should migrate translations to translations_v2 as atomic entries and be idempotent', async () => {
    await migration.up(db);
    const translationsMigrated = await db
      .collection('translations_v2')
      .find({ 'context.id': 'System', language: 'en' })
      .sort({ key: 1 })
      .toArray();

    expect(translationsMigrated).toMatchObject([
      {
        language: 'en',
        key: 'Account',
        value: 'Account',
        context: { type: 'Uwazi UI', label: 'System', id: 'System' },
      },
      {
        language: 'en',
        key: 'Age',
        value: 'Age',
        context: { type: 'Uwazi UI', label: 'System', id: 'System' },
      },
      {
        language: 'en',
        key: 'Email',
        value: 'E-Mail',
        context: { type: 'Uwazi UI', label: 'System', id: 'System' },
      },
      {
        language: 'en',
        key: 'Library',
        value: 'Library',
        context: { type: 'Uwazi UI', label: 'System', id: 'System' },
      },
      {
        language: 'en',
        key: 'Password',
        value: 'Password',
        context: { type: 'Uwazi UI', label: 'System', id: 'System' },
      },
    ]);
  });
});
