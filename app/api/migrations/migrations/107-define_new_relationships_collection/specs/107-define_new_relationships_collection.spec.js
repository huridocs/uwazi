import { ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

let db;
let collection;

const baseRelationship = {
  from: new ObjectId(),
  to: new ObjectId(),
  type: new ObjectId(),
};

const properties = Object.keys(baseRelationship).map(key => ({
  property: key,
}));

describe('migration define_new_relationships_collection', () => {
  beforeAll(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb;
    collection = db.collection('relationships');
    await migration.up(db);
  });

  beforeEach(async () => {
    await testingDB.setupFixturesAndContext({});
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

  it('should allow correct addition', async () => {
    await collection.insertOne(baseRelationship);
    const relationship = await collection.findOne(baseRelationship);
    expect(relationship).toMatchObject(relationship);
  });

  it.each(properties)('should catch missing property "$property"', async ({ property }) => {
    try {
      const relationship = { ...baseRelationship };
      delete relationship[property];
      await collection.insertOne(relationship);
      fail('Should throw MongoError.');
    } catch (err) {
      if (err.message !== 'Document failed validation') {
        throw err;
      }
    }
    const relationships = await collection.find({}).toArray();
    expect(relationships).toHaveLength(0);
  });

  it.each(properties)('should expect "$property" to be an "objectId"', async ({ property }) => {
    try {
      const relationship = { ...baseRelationship };
      relationship[property] = 0;
      await collection.insertOne(relationship);
      fail('Should throw MongoError.');
    } catch (err) {
      if (err.message !== 'Document failed validation') {
        throw err;
      }
    }
    const relationships = await collection.find({}).toArray();
    expect(relationships).toHaveLength(0);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
