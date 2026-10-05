import { Db, ObjectId } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture, OcrRecordDoc } from '../types.js';
import { fixtures, files, ids } from './fixtures.js';

let db: Db;

const records = () => db.collection<OcrRecordDoc>('ocr_records');

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

const byId = async (id: unknown) => records().findOne({ _id: id } as never);

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration normalize-ocr-records', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(213);
  });

  it('should need no Postgres schema, touching Mongo only', () => {
    expect(migration.requiresSchema).toBe(0);
  });

  it('should not need a reindex: ocr records are not indexed', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should treat a queued record as processing, requested when it was last updated', async () => {
    expect(await byId(ids.inQueue)).toEqual({
      _id: ids.inQueue,
      sourceFile: files.inQueue,
      filename: 'in-queue.pdf',
      language: 'eng',
      status: 'processing',
      attempt: 0,
      requestedAt: 1000,
      lastUpdated: 1000,
    });
  });

  it('should keep a processing record processing', async () => {
    expect(await byId(ids.processing)).toMatchObject({
      status: 'processing',
      attempt: 0,
      requestedAt: 2000,
    });
  });

  it('should make a finished record ready, keeping its result and without a request time', async () => {
    expect(await byId(ids.withOCR)).toEqual({
      _id: ids.withOCR,
      sourceFile: files.withOCR,
      resultFile: files.result,
      filename: 'with-ocr.pdf',
      language: 'eng',
      status: 'ready',
      attempt: 0,
      lastUpdated: 3000,
    });
  });

  it('should make a record that could not be processed failed, for an unexpected reason', async () => {
    expect(await byId(ids.cannotProcess)).toMatchObject({
      status: 'failed',
      attempt: 0,
      failureReason: 'unexpected',
    });
  });

  it('should drop an unfinished record whose source file is gone', async () => {
    expect(await byId(ids.missingSource)).toBeNull();
  });

  it('should keep a ready record whose source file is gone, detached, named after its result', async () => {
    expect(await byId(ids.readyMissingSource)).toMatchObject({
      sourceFile: null,
      resultFile: files.detachedResult,
      filename: 'ocr_detached.pdf',
      status: 'ready',
    });
  });

  it('should keep a ready record that was already detached', async () => {
    expect(await byId(ids.detached)).toMatchObject({
      sourceFile: null,
      filename: 'ocr_detached.pdf',
      status: 'ready',
      attempt: 0,
    });
  });

  it('should delete records with neither a source nor a result file', async () => {
    expect(await byId(ids.unusable)).toBeNull();
  });

  it('should delete records in a status that means no OCR was requested', async () => {
    expect(await byId(ids.unknownStatus)).toBeNull();
  });

  it('should fall back to the language `other` when the record has none', async () => {
    expect(await byId(ids.noLanguage)).toMatchObject({ language: 'other' });
  });

  it('should remove the session id from every record', async () => {
    expect(await records().countDocuments({ sessionId: { $exists: true } })).toBe(0);
  });

  it('should leave a record already in the new shape alone', async () => {
    expect(await byId(ids.keyed)).toEqual({
      _id: ids.keyed,
      sourceFile: files.keyed,
      filename: 'keyed.pdf',
      language: 'eng',
      status: 'processing',
      attempt: 2,
      requestedAt: 9000,
      lastUpdated: 9500,
    });
  });

  it('should keep one record per source file: the finished one when there is one', async () => {
    const kept = await records().find({ sourceFile: files.duplicate }).toArray();

    expect(kept.map(record => record._id)).toEqual([ids.duplicateReady]);
  });

  it('should otherwise keep the most recent record', async () => {
    const kept = await records().find({ sourceFile: files.duplicateNoReady }).toArray();

    expect(kept).toEqual([
      expect.objectContaining({ _id: ids.unfinishedNew, status: 'processing' }),
    ]);
  });

  it('should add a unique index on the source file that ignores detached records', async () => {
    const detached = [new ObjectId(), new ObjectId()];

    await expect(records().insertOne({ sourceFile: files.keyed } as never)).rejects.toThrow(
      /duplicate key/
    );
    await expect(
      records().insertMany(detached.map(_id => ({ _id, sourceFile: null })))
    ).resolves.toBeDefined();

    await records().deleteMany({ _id: { $in: detached } });
  });

  it('should be safe to run again', async () => {
    const before = await records().find().sort({ _id: 1 }).toArray();

    await migration.up(db);

    expect(await records().find().sort({ _id: 1 }).toArray()).toEqual(before);
  });

  it('should create the collection with its unique source file index when it does not exist', async () => {
    await testingDB.setupFixturesAndContext({ files: [] });
    await testingDB.mongodb!.collection('ocr_records').drop();

    await migration.up(testingDB.mongodb!);

    const indexes = await testingDB.mongodb!.collection('ocr_records').indexes();
    expect(indexes).toContainEqual(
      expect.objectContaining({
        key: { sourceFile: 1 },
        unique: true,
        partialFilterExpression: { sourceFile: { $type: 'objectId' } },
      })
    );
  });
});
