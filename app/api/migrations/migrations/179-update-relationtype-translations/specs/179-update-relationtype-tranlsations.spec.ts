import { Db } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { fixtures } from './fixtures';
import { Fixture } from '../types';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

describe('Upgrade all Connection translations to Relationship Type', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await initTest(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(179);
  });

  it('should update all Connection translations to Relationship Type', async () => {
    const oldTranslations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ 'context.type': 'Connection' })
      .toArray();

    expect(oldTranslations.length).toBe(0);

    const newTranslations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ 'context.type': 'Relationship Type' })
      .toArray();

    expect(newTranslations.length).toBe(6);
    expect(newTranslations.map(t => t.context.label)).toEqual(
      expect.arrayContaining([
        'Correct value',
        'Valor correcto',
        'Incorrect type 1',
        'Tipo incorrecto 1',
        'Incorrect type 2',
        'Tipo incorrecto 2',
      ])
    );
  });

  it('should NOT alter other translations', async () => {
    const otherTranslations = await testingDB
      .mongodb!.collection('translationsV2')
      .find({ key: 'Im cool' })
      .toArray();

    expect(otherTranslations.length).toBe(2);
    expect(otherTranslations[0].context.type).toBe('Uwazi UI');
    expect(otherTranslations[1].context.type).toBe('Uwazi UI');
  });

  it('should be idempotent (do not throw an error on multiple runs)', async () => {
    await expect(migration.up(testingDB.mongodb!)).resolves.toBe(undefined);
  });
});
