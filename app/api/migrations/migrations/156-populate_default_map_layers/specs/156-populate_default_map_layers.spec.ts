import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Fixture } from '../types.js';
import { fixtures } from './fixtures';

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
    expect(migration.delta).toBe(156);
  });

  it('should add default mapLayers', async () => {
    const settings = await db!.collection('settings').findOne();
    expect(settings?.mapLayers).toEqual(['Streets', 'Hybrid', 'Satellite']);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
