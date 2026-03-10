import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

describe('migration whitelist-sync-attachments', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(115);
  });

  it('should add the whitelisting for attachments on existing sync configs', async () => {
    await migration.up(testingDB.mongodb);

    const [{ sync }] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(sync).toEqual([
      {
        url: 'http://localhost:6667',
        name: 'target1',
        active: true,
        username: 'user',
        password: 'password',
        config: {
          templates: {
            template1: {
              properties: ['holi'],
              attachments: true,
            },
          },
        },
      },
      {
        url: 'http://localhost:6668',
        name: 'target2',
        active: true,
        username: 'user2',
        password: 'password2',
        config: {
          templates: {
            template1: { properties: [], attachments: true },
            template2: { properties: [], attachments: true },
          },
        },
      },
    ]);
  });

  it('should not fail if no syncs are configured', async () => {
    await testingDB.setupFixturesAndContext({ settings: [{ site_name: 'Uwazi' }] });

    await expect(migration.up(testingDB.mongodb)).resolves.toBeUndefined();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
