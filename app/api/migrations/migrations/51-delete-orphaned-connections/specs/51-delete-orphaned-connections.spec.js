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
    expect(migration.delta).toBe(51);
  });

  it('should delete all connections', async () => {
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb
      .collection('connections')
      .find()
      .toArray();
    expect(connections.length).toBe(0);
  });

  it('should delete all orphaned connections except two remaining in hub', async () => {
    const localFixtures = {
      entities: [...fixtures.entities],
      connections: [
        ...fixtures.connections,
        {
          entity: 'sharedid2',
          hub: 'hub1',
        },
      ],
    };
    await testingDB.clearAllAndLoad(localFixtures);
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb
      .collection('connections')
      .find()
      .toArray();
    expect(connections.length).toBe(2);
  });

  it('should not delete any connection', async () => {
    const localFixtures = {
      entities: [...fixtures.entities],
      connections: [
        { ...fixtures.connections[0], entity: 'sharedid1' },
        { ...fixtures.connections[1], entity: 'sharedid2' },
      ],
    };

    await testingDB.clearAllAndLoad(localFixtures);
    await migration.up(testingDB.mongodb);
    const connections = await testingDB.mongodb
      .collection('connections')
      .find()
      .toArray();
    expect(connections.length).toBe(2);
  });
});
