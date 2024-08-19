import { Db } from 'mongodb';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import migration from '../index';
import { fixtures } from './fixtures';

describe('migration remove_obsolete_mongo_index', () => {
  let suggestionsIndexInfo: { [x: string]: any };

  const createIndexes = async (db: Db) => {
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, 'state.labeled': 1, 'state.match': 1 });
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, 'tate.labeled': 1, 'state.withSuggestion': 1 });
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, 'state.labeled': 1, 'state.hasContext': 1 });
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, 'state.labeled': 1, 'state.obsolete': 1 });
    await db
      .collection('ixsuggestions')
      .createIndex({ extractorId: 1, 'state.labeled': 1, 'state.error': 1 });
  };

  const getIndexInfo = async (db: Db) => {
    suggestionsIndexInfo = await db.collection('ixsuggestions').indexInformation();
  };

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => false);
    await testingDB.setupFixturesAndContext(fixtures as DBFixture);
    const db = testingDB.mongodb!;
    await createIndexes(db);
    await migration.up(db);
    await getIndexInfo(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(168);
  });

  it('should remove the targeted indices', async () => {
    expect(
      suggestionsIndexInfo['extractorId_1_tate.labeled_1_state.withSuggestion_1']
    ).toBeUndefined();
  });

  it('should leave the other indices intact', async () => {
    expect(suggestionsIndexInfo['extractorId_1_state.labeled_1_state.match_1']).toBeDefined();
    expect(suggestionsIndexInfo['extractorId_1_state.labeled_1_state.hasContext_1']).toBeDefined();
    expect(suggestionsIndexInfo['extractorId_1_state.labeled_1_state.obsolete_1']).toBeDefined();
    expect(suggestionsIndexInfo['extractorId_1_state.labeled_1_state.error_1']).toBeDefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
