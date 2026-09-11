import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture } from '../types.js';
import { fixtures } from './fixtures.js';

let db: Db;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

const indexKeys = async (collection: string) => {
  const indexes = await db.collection(collection).indexes();
  return indexes.map(index => JSON.stringify(index.key));
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration ix-mongo-indexes', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(209);
  });

  it('should not need a reindex', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should create every index the retired suggestions model declared', async () => {
    const keys = await indexKeys('ixsuggestions');

    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify({ extractorId: 1, 'state.labeled': 1, 'state.match': 1 }),
        JSON.stringify({ extractorId: 1, 'state.labeled': 1, 'state.withSuggestion': 1 }),
        JSON.stringify({ extractorId: 1, 'state.labeled': 1, 'state.hasContext': 1 }),
        JSON.stringify({ extractorId: 1, 'state.labeled': 1, 'state.obsolete': 1 }),
        JSON.stringify({ extractorId: 1, 'state.labeled': 1, 'state.error': 1 }),
        JSON.stringify({ extractorId: 1, useForTraining: 1 }),
        JSON.stringify({ extractorId: 1, date: 1, state: -1 }),
        JSON.stringify({
          extractorId: 1,
          'modelData.suggestionsRunTimestamp': 1,
          status: 1,
          entityId: 1,
        }),
      ])
    );
  });

  /** Dropped without replacement when stage 4a retired `IXExtractorModel`. */
  it('should create the indexes the retired extractors model declared', async () => {
    const keys = await indexKeys('ixextractors');

    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify({ property: 1, templates: 1 }),
        JSON.stringify({ templates: 1, property: 1 }),
      ])
    );
  });

  it('should be safe to run twice', async () => {
    await expect(migration.up(db)).resolves.not.toThrow();
  });
});
