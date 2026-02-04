import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture } from '../types.js';
import { fixtures } from './fixtures.js';

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  await migration.up();
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
    expect(migration.delta).toBe(173);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(true);
  });
});
