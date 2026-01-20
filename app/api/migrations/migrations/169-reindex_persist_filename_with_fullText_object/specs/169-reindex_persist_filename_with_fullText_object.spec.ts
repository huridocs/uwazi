import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '#api/migrations/migrations/169-reindex_persist_filename_with_fullText_object/index.js';
import { Fixture } from '#api/migrations/migrations/169-reindex_persist_filename_with_fullText_object/types.js';
import { fixtures } from '#api/migrations/migrations/169-reindex_persist_filename_with_fullText_object/specs/fixtures.js';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(169);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(true);
  });
});
