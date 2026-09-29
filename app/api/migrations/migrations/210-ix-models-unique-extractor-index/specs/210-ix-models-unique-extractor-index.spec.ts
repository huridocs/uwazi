import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';
import { IXModel } from '../types.js';
import {
  fixtures,
  extractorOne,
  extractorTwo,
  supersededModel,
  survivingModel,
  singleModel,
} from './fixtures.js';

let db: Db;

const readModels = async () =>
  db
    .collection<IXModel>('ixmodels')
    .find({}, { sort: { _id: 1 } })
    .toArray();

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

describe('migration ix-models-unique-extractor-index', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(210);
  });

  it('should not need a reindex', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should create a unique index on extractorId', async () => {
    const indexes = await db.collection('ixmodels').indexes();
    const extractorIndex = indexes.find(
      index => JSON.stringify(index.key) === JSON.stringify({ extractorId: 1 })
    );

    expect(extractorIndex).toMatchObject({ unique: true });
  });

  it('should keep only the newest row of a duplicated extractor', async () => {
    const models = await readModels();

    expect(models.map(model => model._id)).toEqual([survivingModel, singleModel]);
    expect(models[0]).toMatchObject({ extractorId: extractorOne, status: 'processing' });
  });

  it('should leave a single-row extractor untouched', async () => {
    const models = await readModels();

    expect(models.find(model => model._id.equals(singleModel))).toMatchObject({
      extractorId: extractorTwo,
    });
  });

  it('should have removed the superseded row', async () => {
    const superseded = await db.collection('ixmodels').findOne({ _id: supersededModel });

    expect(superseded).toBeNull();
  });

  // Unreachable rows, and more than one of them would collide on the unique index.
  it('should remove every row that has no extractorId', async () => {
    const orphans = await db.collection('ixmodels').countDocuments({ extractorId: null });

    expect(orphans).toBe(0);
  });

  it('should refuse a second model row for an extractor that already has one', async () => {
    await expect(
      db.collection('ixmodels').insertOne({ extractorId: extractorTwo, status: 'processing' })
    ).rejects.toThrow(/duplicate key/);
  });

  it('should be safe to run twice', async () => {
    await expect(migration.up(db)).resolves.not.toThrow();
  });
});
