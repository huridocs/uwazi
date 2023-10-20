import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove_obsolete_mongo_index', () => {
  let suggestionsIndexInfo;

  const createIndexes = async db => {
    await db.collection('ixsuggestions').createIndex({ entityId: 1 });
    await db.collection('ixsuggestions').createIndex({ fileId: 1 });
    await db.collection('ixsuggestions').createIndex({ extractorId: 1, entityId: 1, fileId: 1 });
    await db.collection('ixsuggestions').createIndex({ extractorId: 1, date: 1, state: -1 });
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, entityTemplate: 1, state: 1 });
  };

  const getIndexInfo = async db => {
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
    expect(migration.delta).toBe(147);
  });

  it('should remove the targeted indices', async () => {
    expect(suggestionsIndexInfo['extractorId_1_date_1_state_-1']).toBe(undefined);
    expect(suggestionsIndexInfo.extractorId_1_entityTemplate_1_state_1).toBe(undefined);
  });

  it('should leave the other indices intact', async () => {
    expect(suggestionsIndexInfo.entityId_1).toEqual([['entityId', 1]]);
    expect(suggestionsIndexInfo.fileId_1).toEqual([['fileId', 1]]);
    expect(suggestionsIndexInfo.extractorId_1_entityId_1_fileId_1).toEqual([
      ['extractorId', 1],
      ['entityId', 1],
      ['fileId', 1],
    ]);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
