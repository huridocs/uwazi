import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixturesWithSync from './fixtures_with_sync.js';
import fixturesWithoutSync from './fixtures_without_sync.js';

describe('migration multiple sync', () => {
  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const getSyncData = async () => {
    const [{ sync }] = await testingDB.mongodb.collection('settings').find({}).toArray();
    const syncs = await testingDB.mongodb.collection('syncs').find({}).toArray();

    return { sync, syncs };
  };

  it('should have a delta number', () => {
    expect(migration.delta).toBe(30);
  });

  it('should nest settings.sync in an array and name settings and syncs collection ', async () => {
    await testingDB.clearAllAndLoad(fixturesWithSync);

    await migration.up(testingDB.mongodb);

    const { sync, syncs } = await getSyncData();

    expect(sync).toEqual([{ url: 'url', name: 'default', config: { templates: { t1: ['p1'] } } }]);
    expect(syncs).toEqual([expect.objectContaining({ lastSync: 1900, name: 'default' })]);
  });

  it('should respect collections that don`t have sync configured', async () => {
    await testingDB.clearAllAndLoad(fixturesWithoutSync);
    await migration.up(testingDB.mongodb);
    const { sync, syncs } = await getSyncData();

    expect(sync).not.toBeDefined();
    expect(syncs.length).toBe(0);
  });

  it('should not affect other settings', async () => {
    await testingDB.clearAllAndLoad(fixturesWithSync);
    await migration.up(testingDB.mongodb);
    const collectionSettings = await testingDB.mongodb.collection('settings').find({}).toArray();

    const [{ otherProperty }] = collectionSettings;
    expect(otherProperty).toBe('test');
  });
});
