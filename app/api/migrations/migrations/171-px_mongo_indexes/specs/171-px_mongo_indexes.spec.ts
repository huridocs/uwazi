import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '#api/migrations/migrations/171-px_mongo_indexes/index.js';
import { Fixture } from '#api/migrations/migrations/171-px_mongo_indexes/types.js';
import { fixtures } from '#api/migrations/migrations/171-px_mongo_indexes/specs/fixtures.js';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(171);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should create indices for px_entities_status', async () => {
    const indexes = await db?.collection('px_entities_status').listIndexes().toArray();
    expect(indexes).toMatchObject([
      { key: { _id: 1 } },
      { key: { extractorId: 1, entitySharedId: 1 }, unique: true },
    ]);
  });

  it('should create indices for px_extractors', async () => {
    const indexes = await db?.collection('px_extractors').listIndexes().toArray();
    expect(indexes).toMatchObject([{ key: { _id: 1 } }, { key: { sourceTemplateId: 1 } }]);
  });
});
