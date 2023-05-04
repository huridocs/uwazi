import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

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
    expect(migration.delta).toBe(133);
  });

  it('should set up the relationships collection', async () => {
    const collections = await db.listCollections().toArray();
    const relCollection = collections.find(c => c.name === 'relationships');
    expect(relCollection).toBeDefined();
  });

  it('should set up the relationships collection with the correct indices', async () => {
    const relCollection = await db.collection('relationships');
    const indexInfo = await relCollection.indexInformation();
    expect(indexInfo).toEqual({
      _id_: [['_id', 1]],
      'type_1_from.entity_1_to.entity_1': [
        ['type', 1],
        ['from.entity', 1],
        ['to.entity', 1],
      ],
      'from.entity_1_to.entity_1': [
        ['from.entity', 1],
        ['to.entity', 1],
      ],
      'to.entity_1_type_1': [
        ['to.entity', 1],
        ['type', 1],
      ],
    });
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
