import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration remove-duplicated-relationships', () => {
  beforeEach(async () => {
    // jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(128);
  });

  it('should remove the duplicated relationships in hubs used by relationship properties', async () => {
    await migration.up(testingDB.mongodb);
    const relationships = await testingDB.mongodb.collection('connections').find({}).toArray();
    expect(relationships).toEqual([
      fixtures.connections[0],
      fixtures.connections[1],
      fixtures.connections[2],
      // fixtures.connections[3],
      // fixtures.connections[4],
      fixtures.connections[5],
      fixtures.connections[6],
      fixtures.connections[7],
      // fixtures.connections[8],
      // fixtures.connections[9],
      fixtures.connections[10],
      fixtures.connections[11],
      // fixtures.connections[12],
      // fixtures.connections[13],
      // fixtures.connections[14],
      fixtures.connections[15],
      fixtures.connections[16],
      fixtures.connections[17],
      fixtures.connections[18],
      fixtures.connections[19],
      // fixtures.connections[20],
      fixtures.connections[21],
      fixtures.connections[22],
      fixtures.connections[23],
      fixtures.connections[24],
    ]);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
