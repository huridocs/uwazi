import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { hub1, hub3, shared1, shared2, shared3, shared4, shared5 } from './fixtures.js';

describe('migration connections_sanitizing', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(6);
  });

  describe('Migration logic', () => {
    let migratedConnections;

    beforeEach(async () => {
      await migration.up(testingDB.mongodb);
      migratedConnections = await testingDB.mongodb.collection('connections').find().toArray();
    });

    it('should keep all connections present in all languages', async () => {
      expect(migratedConnections.filter(c => c.hub.toString() === hub1).length).toBe(6);
      expect(migratedConnections.filter(c => c.sharedId.toString() === shared1).length).toBe(3);
      expect(migratedConnections.filter(c => c.sharedId.toString() === shared5).length).toBe(3);
    });

    it('should keep correcly formed text connections (even if not in all languages)', async () => {
      expect(migratedConnections.filter(c => c.sharedId.toString() === shared4).length).toBe(2);
    });

    it('should delete incomplete connections', async () => {
      expect(migratedConnections.filter(c => c.sharedId.toString() === shared2).length).toBe(0);
      expect(migratedConnections.filter(c => c.sharedId.toString() === shared3).length).toBe(0);
    });

    it('should delete hubs that have only 1 connection, even if correctly conformed', async () => {
      expect(migratedConnections.filter(c => c.hub.toString() === hub3).length).toBe(0);
    });
  });
});
