import testingDB from 'api/utils/testing_db';
import migration, { newKeys, deletedKeys } from '../index.js';
import fixtures from './fixtures.js';

describe('migration update translations of settings new Users/Groups UI', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(147);
  });

  it('should delete old translations', async () => {
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb
      .collection('translations')
      .find({ key: { $in: deletedKeys.map(k => k.key) } })
      .toArray();

    expect(translations).toEqual([]);
  });

  it('should add new translations per language', async () => {
    await migration.up(testingDB.mongodb);
    const translations = await testingDB.mongodb
      .collection('translations')
      .find({ key: { $in: newKeys.map(k => k.key) } })
      .toArray();

    expect(translations.length).toBe(newKeys.length * fixtures.settings[0].languages.length);
  });
});
