import { Db, ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { fixtures } from './fixtures';

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

describe('migration per_namespace_lastSyncs', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(150);
  });

  it('should add timestamps per collection to the sync objects', async () => {
    const syncs = await db!.collection('syncs').find().toArray();
    expect(syncs).toEqual([
      {
        _id: expect.any(ObjectId),
        name: 'sync1',
        lastSyncs: {
          settings: 0,
          translationsV2: 0,
          dictionaries: 0,
          relationtypes: 0,
          templates: 0,
          files: 0,
          connections: 0,
          entities: 0,
        },
      },
      {
        _id: expect.any(ObjectId),
        name: 'sync2',
        lastSyncs: {
          settings: 1700127956,
          translationsV2: 1700127956,
          dictionaries: 1700127956,
          relationtypes: 1700127956,
          templates: 1700127956,
          files: 1700127956,
          connections: 1700127956,
          entities: 1700127956,
        },
      },
      {
        _id: expect.any(ObjectId),
        name: 'sync3',
        lastSyncs: {
          settings: 0,
          translationsV2: 0,
          dictionaries: 0,
          relationtypes: 0,
          templates: 0,
          files: 0,
          connections: 0,
          entities: 0,
        },
      },
    ]);
  });

  it('should not reindex', async () => {
    expect(migration.reindex).toBe(false);
  });
});
