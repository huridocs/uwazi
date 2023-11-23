import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures } from './fixtures.js';

let db: Db | null;

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
  await testingDB.setupFixturesAndContext(fixtures);
  db = testingDB.mongodb!;
  await migration.up(db);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration remove_duplicate_entities', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(151);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(undefined);
  });
});
