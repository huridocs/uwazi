import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';

let db: Db;

describe('migration add collections for v2 relationships migration', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb!;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(140);
  });

  it('should set up the migration fields collection', async () => {
    const collections = await db.listCollections().toArray();
    const coll = collections.find(c => c.name === 'relationshipMigrationFields');
    expect(coll).toBeDefined();
  });

  it('should set up the hub records collection', async () => {
    const collections = await db.listCollections().toArray();
    const coll = collections.find(c => c.name === 'migrationHubRecords');
    expect(coll).toBeDefined();
  });

  it('should set up the correct indices on the migration fields', async () => {
    const relCollection = db.collection('relationshipMigrationFields');
    const indexInfo = await relCollection.indexInformation();
    expect(indexInfo).toEqual({
      _id_: [['_id', 1]],
      sourceTemplate_1_relationType_1_targetTemplate_1: [
        ['sourceTemplate', 1],
        ['relationType', 1],
        ['targetTemplate', 1],
      ],
    });
  });

  it('should set up the correct indices on the hub records', async () => {
    const relCollection = db.collection('migrationHubRecords');
    const indexInfo = await relCollection.indexInformation();
    expect(indexInfo).toEqual({
      _id_: [['_id', 1]],
    });
  });

  it('should set unique index on the migration fields', async () => {
    const relCollection = await db.collection('relationshipMigrationFields');
    const indexInfo = await relCollection.indexInformation({ full: true });
    const uniqueIndex = indexInfo.find(
      (index: any) => index.name === 'sourceTemplate_1_relationType_1_targetTemplate_1'
    );
    expect(uniqueIndex.unique).toBe(true);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
