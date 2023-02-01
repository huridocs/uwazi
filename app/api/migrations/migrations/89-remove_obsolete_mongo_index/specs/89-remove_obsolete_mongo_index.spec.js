import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_obsolete_mongo_index', () => {
  let entitiesIndexInfo;
  let suggestionsIndexInfo;

  const createIndexes = async db => {
    await db.collection('entities').createIndex({ language: 1 });
    await db.collection('entities').createIndex({ sharedId: 1 });
    await db.collection('entities').createIndex({ template: 1 });
    await db.collection('entities').createIndex({ template: 1, language: 1, published: 1 });
    await db.collection('ixsuggestions').createIndex({ propertyName: 'text' });
    await db.collection('ixsuggestions').createIndex({ entityId: 1 });
  };

  const getIndexInfo = async db => {
    entitiesIndexInfo = await db.collection('entities').indexInformation();
    suggestionsIndexInfo = await db.collection('ixsuggestions').indexInformation();
  };

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    const db = testingDB.mongodb;
    await createIndexes(db);
    await migration.up(db);
    await getIndexInfo(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(89);
  });

  it('should remove the targeted indices', async () => {
    expect(entitiesIndexInfo.template_1).toBe(undefined);
    expect(suggestionsIndexInfo.propertyName_text).toBe(undefined);
  });

  it('should leave the other indices intact', async () => {
    expect(entitiesIndexInfo._id_).toEqual([['_id', 1]]);
    expect(entitiesIndexInfo.language_1).toEqual([['language', 1]]);
    expect(entitiesIndexInfo.sharedId_1).toEqual([['sharedId', 1]]);
    expect(entitiesIndexInfo.template_1_language_1_published_1).toEqual([
      ['template', 1],
      ['language', 1],
      ['published', 1],
    ]);
    expect(suggestionsIndexInfo.entityId_1).toEqual([['entityId', 1]]);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
