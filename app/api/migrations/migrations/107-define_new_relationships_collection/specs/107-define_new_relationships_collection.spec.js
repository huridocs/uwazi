import { ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

let db;
let collection;

describe('migration define_new_relationships_collection', () => {
  beforeAll(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb;
    collection = db.collection('relationships');
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(107);
  });

  it('should create the relationships collection', async () => {
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);
    expect(names).toContain('relationships');
  });

  // it.each([
  //   {
  //     property: 'from',
  //     relationship: {
  //       from: new ObjectId(),
  //       to: new ObjectId(),
  //       type: new ObjectId(),
  //     },
  //   },
  // ])('should catch missing property "$property"', relationship => {
  //   collection.insertOne(relationship);
  // });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
