import { Db } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import migration, { newKeys, deletedKeys } from '../index';
import { fixtures } from './fixtures';
import { Fixture } from '../types';

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
    expect(migration.delta).toBe(163);
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

    expect(translations.length).toBe(24);
  });

  it('should be idempotent (do not throw an error on multiple runs)', async () => {
    await expect(migration.up(testingDB.mongodb!)).resolves.toBe(undefined);
  });
});
