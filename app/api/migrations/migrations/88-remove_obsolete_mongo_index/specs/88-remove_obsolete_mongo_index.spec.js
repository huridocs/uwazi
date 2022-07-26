import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_obsolete_mongo_index', () => {
  let db;
  let indexInfo;

  beforeAll(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
    await db.collection('entities').createIndex({ language: 1 });
    await db.collection('entities').createIndex({ sharedId: 1 });
    await db.collection('entities').createIndex({ template: 1 });
    await db.collection('entities').createIndex({ template: 1, language: 1, published: 1 });
    await migration.up(db);
    indexInfo = await db.collection('entities').indexInformation();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(88);
  });

  it('should remove the targeted indices', async () => {
    expect(indexInfo.template_1).toBe(undefined);
  });

  it('should leave the other indices intact', async () => {
    expect(indexInfo._id_).toEqual([['_id', 1]]);
    expect(indexInfo.language_1).toEqual([['language', 1]]);
    expect(indexInfo.sharedId_1).toEqual([['sharedId', 1]]);
    expect(indexInfo.template_1_language_1_published_1).toEqual([
      ['template', 1],
      ['language', 1],
      ['published', 1],
    ]);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
