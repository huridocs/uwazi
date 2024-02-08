import testingDB from 'api/utils/testing_db';
import migration, { newKeys, deletedKeys } from '../index.js';
import fixtures from './fixtures.js';

describe('migration update translations of settings new Users/Groups UI', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(157);
  });

  it('should delete old translations', async () => {
    const translations = await testingDB.mongodb
      .collection('translationsV2')
      .find({ key: { $in: deletedKeys.map(k => k.key) } })
      .toArray();

    expect(translations).toEqual([]);
  });

  it('should NOT delete other translations', async () => {
    const translations = await testingDB.mongodb
      .collection('translationsV2')
      .find({ key: 'Im cool' })
      .toArray();

    expect(translations.length).toBe(2);
  });

  it('should add new translations per language', async () => {
    const translations = await testingDB.mongodb
      .collection('translationsV2')
      .find({ key: { $in: newKeys.map(k => k.key) } })
      .toArray();

    expect(translations.length).toBe(2);
  });

  it('should be idempotent (do not throw an error on multiple runs)', async () => {
    await expect(migration.up(testingDB.mongodb)).resolves.toBe(undefined);
  });
});
