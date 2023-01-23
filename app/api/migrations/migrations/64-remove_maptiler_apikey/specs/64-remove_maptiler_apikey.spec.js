import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove maptiler apikey', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(64);
  });

  it('should fail', async () => {
    await migration.up(testingDB.mongodb);
    const [settings] = await testingDB.mongodb.collection('settings').find({}).toArray();
    expect(settings.mapTilerKey).toBeUndefined();
    expect(settings.site_name).toBe('something cool');
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
