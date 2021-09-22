import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration delete-orphaned-connections', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(53);
  });

  it('should delete all connections which do not have an existing entity', async () => {
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb
      .collection('connections')
      .find()
      .toArray();
    expect(connections.length).toBe(3);
  });

  it('should delete all connections who are alone in a hub', async () => {
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb
      .collection('connections')
      .find()
      .toArray();
    expect(connections).toEqual(
      expect.arrayContaining([expect.not.objectContaining({ hub: 'hub3' })])
    );
  });
});
