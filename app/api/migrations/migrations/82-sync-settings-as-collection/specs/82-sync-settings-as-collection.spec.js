import testingDB from 'api/utils/testing_db';
import migration from '../index.js';

describe('migration sync-settings-as-collection', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(82);
  });

  it('should change sync settings to be an array', async () => {
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          site_name: 'uwazi',
          sync: {
            name: 'sync configuration',
          },
        },
      ],
    });

    await migration.up(testingDB.mongodb);

    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings).toMatchObject({
      sync: [{ name: 'sync configuration' }],
    });

    await migration.up(testingDB.mongodb);

    const [settings2] = await testingDB.mongodb.collection('settings').find().toArray();
    expect(settings2).toMatchObject({
      sync: [{ name: 'sync configuration' }],
    });
  });

  it('should ignore settings with no sync configured', async () => {
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          site_name: 'uwazi',
        },
      ],
    });

    await migration.up(testingDB.mongodb);

    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings.sync).not.toBeDefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
