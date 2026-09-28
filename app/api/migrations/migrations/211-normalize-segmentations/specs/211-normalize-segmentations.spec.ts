import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture, SegmentationDoc } from '../types.js';
import { duplicates, files, fixtures, ids } from './fixtures.js';

let db: Db;

const segmentations = () => db.collection<SegmentationDoc>('segmentations');

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await segmentations().createIndex(
    { autoexpire: 1 },
    { name: 'autoexpire_1', expireAfterSeconds: 86400 }
  );
  await migration.up(db);
};

const byId = async (id: unknown) => segmentations().findOne({ _id: id } as never);

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration normalize-segmentations', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(211);
  });

  it('should need no Postgres schema, touching Mongo only', () => {
    expect(migration.requiresSchema).toBe(0);
  });

  it('should not need a reindex: segmentations are not indexed', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should return a claim of the old dispatch loop to idle, to be requested again', async () => {
    expect(await byId(ids.claim)).toEqual({
      _id: ids.claim,
      fileID: files.claim,
      filename: 'claim.pdf',
      status: 'idle',
      attempt: 0,
    });
  });

  it('should return a failure the old loop would have retried to idle', async () => {
    expect(await byId(ids.dispatchFailure)).toMatchObject({ status: 'idle', attempt: 0 });
  });

  it('should keep a failure the service reported', async () => {
    expect(await byId(ids.serviceFailure)).toMatchObject({ status: 'failed', attempt: 0 });
  });

  it('should keep a ready segmentation as it is, without the TTL field', async () => {
    const ready = await byId(ids.ready);

    expect(ready).toMatchObject({ status: 'ready', attempt: 0, xmlname: 'ready.xml' });
    expect(ready).not.toHaveProperty('autoexpire');
  });

  it('should leave a segmentation written by the new pipeline alone', async () => {
    expect(await byId(ids.keyed)).toEqual({
      _id: ids.keyed,
      fileID: files.keyed,
      filename: 'keyed.pdf',
      status: 'processing',
      attempt: 2,
      requestedAt: 1000,
    });
  });

  it('should delete segmentations with no file or no filename', async () => {
    expect(await byId(ids.noFile)).toBeNull();
    expect(await byId(ids.noFilename)).toBeNull();
  });

  it('should keep one segmentation per file: the ready one when there is one', async () => {
    const kept = await segmentations().find({ fileID: files.withReadyDuplicate }).toArray();

    expect(kept.map(s => s._id)).toEqual([duplicates.ready]);
  });

  it('should otherwise keep the most recent one', async () => {
    const kept = await segmentations().find({ fileID: files.withoutReadyDuplicate }).toArray();

    expect(kept).toEqual([expect.objectContaining({ _id: duplicates.newerClaim, status: 'idle' })]);
  });

  it('should leave no TTL field on any segmentation', async () => {
    expect(await segmentations().countDocuments({ autoexpire: { $exists: true } })).toBe(0);
  });

  it('should drop the TTL index and add one segmentation per file and idle paging indexes', async () => {
    const indexes = await segmentations().indexes();

    expect(indexes.find(index => index.key.autoexpire)).toBeUndefined();
    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: { fileID: 1 }, unique: true }),
        expect.objectContaining({ key: { status: 1, _id: 1 } }),
      ])
    );
  });

  it('should be safe to run again', async () => {
    const before = await segmentations().find().sort({ _id: 1 }).toArray();

    await migration.up(db);

    expect(await segmentations().find().sort({ _id: 1 }).toArray()).toEqual(before);
  });

  it('should run on a tenant that has no segmentations collection', async () => {
    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb!;
    await db.dropCollection('segmentations').catch(() => {});

    await expect(migration.up(db)).resolves.not.toThrow();
  });
});
