import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture, SegmentationDoc } from '../types.js';
import { existing, files, fixtures } from './fixtures.js';

let db: Db;

const segmentations = async () =>
  db.collection<SegmentationDoc>('segmentations').find().sort({ filename: 1 }).toArray();

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

describe('migration backfill-segmentations', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(212);
  });

  it('should need no Postgres schema, touching Mongo only', () => {
    expect(migration.requiresSchema).toBe(0);
  });

  it('should not need a reindex: segmentations are not indexed', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should register an idle segmentation for each PDF document that has none, and nothing else', async () => {
    expect(await segmentations()).toEqual([
      existing,
      {
        _id: expect.anything(),
        fileID: files.unsegmented._id,
        filename: 'new.pdf',
        status: 'idle',
        attempt: 0,
      },
    ]);
  });

  it('should be safe to run again', async () => {
    const before = await segmentations();

    await migration.up(db);

    expect(await segmentations()).toEqual(before);
  });

  it('should run on a tenant without files', async () => {
    await testingDB.setupFixturesAndContext({ files: [], segmentations: [] });
    db = testingDB.mongodb!;

    await migration.up(db);

    expect(await segmentations()).toEqual([]);
  });
});
