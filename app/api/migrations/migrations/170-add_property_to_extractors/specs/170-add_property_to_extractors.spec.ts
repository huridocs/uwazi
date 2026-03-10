import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Fixture } from '../types';
import { fixtures } from './fixtures';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(170);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should update the extractors with the new key', async () => {
    const updatedExtractors = await testingDB.mongodb
      ?.collection('ixextractors')
      .find({})
      .toArray();
    expect(updatedExtractors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ex1',
          property: 'prop1',
          templates: ['a1', 'b2'],
          source: { pdf: true },
        }),
        expect.objectContaining({
          name: 'ex2',
          property: 'prop2',
          templates: ['b2'],
          source: { pdf: true },
        }),
        expect.objectContaining({
          name: 'ex3',
          templates: ['a1', 'c1'],
          property: 'prop3',
          source: { pdf: true },
        }),
      ])
    );
  });
});
