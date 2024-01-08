import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  migration.reindex = false;
  await migration.up(db);
};

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration repair_select_parent_denormalization', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(153);
  });

  it('should fail', async () => {
    await migration.up();
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(undefined);
  });
});
