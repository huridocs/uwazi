import { testingDB } from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration add_system_key_translations', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(55);
  });

  it('should insert added translations to system context', async () => {
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb
      .collection('translations')
      .find({ locale: 'en', 'contexts.id': 'System' })
      .toArray();
    expect(translations[0].contexts[0].values).toEqual([
      { key: 'EXISTING_KEY', value: 'EXISTING_VALUE' },
      { key: 'FEATURED', value: 'FEATURED' },
      { key: 'ALL', value: 'ALL' },
    ]);
  });
});
