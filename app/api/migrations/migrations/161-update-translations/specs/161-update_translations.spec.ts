import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration, {
  newKeys,
  deletedKeys,
} from '#api/migrations/migrations/161-update-translations/index.js';
import { fixtures } from '#api/migrations/migrations/161-update-translations/specs/fixtures.js';
import { Fixture } from '#api/migrations/migrations/161-update-translations/types.js';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

describe('migration update translations of settings', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await initTest(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(161);
  });

  it('should delete old translations', async () => {
    const translations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ key: { $in: deletedKeys.map(k => k.key) } })
      .toArray();

    expect(translations).toEqual([]);
  });

  it('should NOT delete other translations', async () => {
    const translations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ key: 'Im cool' })
      .toArray();

    expect(translations.length).toBe(2);
  });

  it('should add new translations per language', async () => {
    const translations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ key: { $in: newKeys.map(k => k.key) } })
      .toArray();

    expect(translations.length).toBe(4);
  });

  it('should be idempotent (do not throw an error on multiple runs)', async () => {
    await expect(migration.up(testingDB.mongodb!)).resolves.toBe(undefined);
  });
});
