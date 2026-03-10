import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove_orphan_relations', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(15);
  });

  it('should remove connections that have entities that no longer exists', async () => {
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb.collection('connections').find().toArray();

    expect(connections.map(c => c.entity)).toEqual(['entity1', 'entity2']);
  });
});
