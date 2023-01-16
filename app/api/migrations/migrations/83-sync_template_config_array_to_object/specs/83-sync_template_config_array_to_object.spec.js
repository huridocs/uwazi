import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration sync_template_config_array_to_object', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(83);
  });

  it('should transform old sync config templates to the new object version', async () => {
    await migration.up(testingDB.mongodb);
    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings.sync).toEqual([
      {
        url: 'url',
        name: 'target',
        active: true,
        username: 'user',
        password: 'password',
        config: {
          templates: {
            templateId1: { properties: ['prop'] },
          },
        },
      },
      {
        url: 'url',
        name: 'target',
        active: true,
        username: 'user',
        password: 'password',
        config: {
          templates: {
            templateId2: { properties: ['prop1', 'prop2'] },
            templateId3: { properties: ['prop3', 'prop4'] },
          },
        },
      },
      {
        url: 'url',
        name: 'target',
        active: true,
        username: 'user',
        password: 'password',
        config: {
          templates: {
            templateId4: { properties: ['prop5', 'prop6'] },
            templateId5: { properties: ['prop7', 'prop8'] },
            templateId6: { properties: ['prop42'] },
          },
        },
      },
    ]);
  });

  it('should not fail if sync is undefined', async () => {
    await testingDB.setupFixturesAndContext({ settings: [{}] });
    await expect(migration.up(testingDB.mongodb)).resolves.toBeUndefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
