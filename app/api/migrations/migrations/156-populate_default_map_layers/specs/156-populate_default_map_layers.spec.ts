import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '#api/migrations/migrations/156-populate_default_map_layers/index.js';
import { Fixture } from '#api/migrations/migrations/156-populate_default_map_layers/types.js';
import { fixtures } from '#api/migrations/migrations/156-populate_default_map_layers/specs/fixtures.js';

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
