import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
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
    expect(migration.delta).toBe(137);
  });

  it('should set up the relationships collection', async () => {
    const collections = await db.listCollections().toArray();
    const relCollection = collections.find(c => c.name === 'translationsV2');
    expect(relCollection).toBeDefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should set up the relationships collection with the correct indices', async () => {
    const indexInfo = await db.collection('translationsV2').indexInformation();
    expect(indexInfo).toEqual({
      _id_: [['_id', 1]],
      'context.id_1_key_1': [
        ['context.id', 1],
        ['key', 1],
      ],
      'language_1_key_1_context.id_1': [
        ['language', 1],
        ['key', 1],
        ['context.id', 1],
      ],
    });
  });

  it('should migrate translations to translationsV2 as atomic entries and be idempotent', async () => {
    await migration.up(db);

    const translationsMigrated = await db
      .collection('translationsV2')
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

  it('should make sure all keys/context exists in all langauges', async () => {
    await testingDB.setupFixturesAndContext({
      ...fixtures,
      translations: [
        {
          type: 'translation',
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              values: [
                { key: 'Key 1', value: 'Value 1 es' },
                { key: 'Key 3', value: 'Value 3 es' },
              ],
            },
          ],
        },
        {
          type: 'translation',
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'System',
              values: [
                { key: 'Key 2', value: 'Value 2 en' },
                { key: 'Key 3', value: 'Value 3 en' },
                { key: 'Key 4', value: 'Value 4 en' },
              ],
            },
          ],
        },
        {
          type: 'translation',
          locale: 'zh',
          contexts: [
            {
              id: 'System',
              label: 'System',
              values: [
                { key: 'Key 1', value: 'Value 1 zh' },
                { key: 'Key 2', value: 'Value 2 zh' },
                { key: 'Key 4', value: 'Value 4 zh' },
              ],
            },
          ],
        },
      ],
    });

    await migration.up(db);

    const translationsMigrated = await db
      .collection('translationsV2')
      .find()
      .sort({ language: 1, key: 1 })
      .toArray();

    expect(translationsMigrated).toMatchObject([
      { key: 'Key 1', value: 'Value 1 es', language: 'en' },
      { key: 'Key 2', value: 'Value 2 en', language: 'en' },
      { key: 'Key 3', value: 'Value 3 en', language: 'en' },
      { key: 'Key 4', value: 'Value 4 en', language: 'en' },

      { key: 'Key 1', value: 'Value 1 es', language: 'es' },
      { key: 'Key 2', value: 'Value 2 en', language: 'es' },
      { key: 'Key 3', value: 'Value 3 es', language: 'es' },
      { key: 'Key 4', value: 'Value 4 en', language: 'es' },

      { key: 'Key 1', value: 'Value 1 zh', language: 'zh' },
      { key: 'Key 2', value: 'Value 2 zh', language: 'zh' },
      { key: 'Key 3', value: 'Value 3 es', language: 'zh' },
      { key: 'Key 4', value: 'Value 4 zh', language: 'zh' },
    ]);
  });

  it('should create updatelogs in order to support sync out of the box', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(0);

    await testingDB.setupFixturesAndContext({
      ...fixtures,

      settings: [
        {
          languages: [
            { key: 'es', label: 'Español' },
            { key: 'en', label: 'English', default: true },
          ],
        },
      ],
      translations: [
        {
          type: 'translation',
          locale: 'es',
          contexts: [
            {
              id: 'System',
              label: 'System',
              values: [
                { key: 'Key 1', value: 'Value 1 es' },
                { key: 'Key 3', value: 'Value 3 es' },
              ],
            },
          ],
        },
        {
          type: 'translation',
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'System',
              values: [
                { key: 'Key 2', value: 'Value 2 en' },
                { key: 'Key 3', value: 'Value 3 en' },
              ],
            },
          ],
        },
      ],
    });

    await migration.up(db);
    const updatelogs = await db
      .collection('updatelogs')
      .find({ namespace: 'translationsV2' })
      .sort({ timestamp: 1 })
      .toArray();

    expect(updatelogs).toMatchObject([
      { mongoId: expect.any(ObjectId), timestamp: 1, namespace: 'translationsV2', deleted: false },
      { mongoId: expect.any(ObjectId), timestamp: 2, namespace: 'translationsV2', deleted: false },
      { mongoId: expect.any(ObjectId), timestamp: 3, namespace: 'translationsV2', deleted: false },
      { mongoId: expect.any(ObjectId), timestamp: 4, namespace: 'translationsV2', deleted: false },
      { mongoId: expect.any(ObjectId), timestamp: 5, namespace: 'translationsV2', deleted: false },
      { mongoId: expect.any(ObjectId), timestamp: 6, namespace: 'translationsV2', deleted: false },
    ]);

    const translationsMigrated = await db
      .collection('translationsV2')
      .find({ _id: { $in: updatelogs.map(u => u.mongoId) } })
      .sort({ language: 1, key: 1 })
      .toArray();

    expect(translationsMigrated).toMatchObject([
      { _id: expect.any(ObjectId), key: 'Key 1', value: 'Value 1 es', language: 'en' },
      { _id: expect.any(ObjectId), key: 'Key 2', value: 'Value 2 en', language: 'en' },
      { _id: expect.any(ObjectId), key: 'Key 3', value: 'Value 3 en', language: 'en' },
      { _id: expect.any(ObjectId), key: 'Key 1', value: 'Value 1 es', language: 'es' },
      { _id: expect.any(ObjectId), key: 'Key 2', value: 'Value 2 en', language: 'es' },
      { _id: expect.any(ObjectId), key: 'Key 3', value: 'Value 3 es', language: 'es' },
    ]);
  });

  it('should maintain updatelogs not beloning to translationsV2 namespace', async () => {
    const updatelogs = await db
      .collection('updatelogs')
      .find({ namespace: 'test_namespace' })
      .toArray();
    expect(updatelogs.length).toBe(1);
  });
});
