import { ObjectId } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures, ids } from './fixtures.js';

describe('normalize ixsuggestions.fileId to ObjectId migration', () => {
  const getSuggestion = async (_id: ObjectId) =>
    testingDB.mongodb!.collection('ixsuggestions').findOne({ _id });

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingDB.clearAllAndLoadFixtures(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have delta 196', () => {
    expect(migration.delta).toBe(196);
  });

  it('should convert 24-char hex string fileId values to ObjectId', async () => {
    await migration.up(testingDB.mongodb!);

    const converted = await getSuggestion(ids.suggestionA);
    expect(converted?.fileId).toBeInstanceOf(ObjectId);
    expect((converted?.fileId as ObjectId).toString()).toBe(ids.fileA.toString());
  });

  it('should keep already-ObjectId and invalid string fileId values unchanged', async () => {
    await migration.up(testingDB.mongodb!);

    const alreadyObjectId = await getSuggestion(ids.suggestionB);
    const invalidString = await getSuggestion(ids.suggestionC);

    expect(alreadyObjectId?.fileId).toBeInstanceOf(ObjectId);
    expect((alreadyObjectId?.fileId as ObjectId).toString()).toBe(ids.fileB.toString());

    expect(invalidString?.fileId).toBe('not-an-objectid');
  });

  it('should remove malformed suggestions missing required fields', async () => {
    await migration.up(testingDB.mongodb!);

    const missingFileId = await getSuggestion(ids.suggestionD);

    expect(missingFileId).toBeNull();
  });

  it('should be idempotent', async () => {
    await migration.up(testingDB.mongodb!);
    await migration.up(testingDB.mongodb!);

    const converted = await getSuggestion(ids.suggestionA);
    const alreadyObjectId = await getSuggestion(ids.suggestionB);
    const invalidString = await getSuggestion(ids.suggestionC);

    expect(converted?.fileId).toBeInstanceOf(ObjectId);
    expect((converted?.fileId as ObjectId).toString()).toBe(ids.fileA.toString());
    expect(alreadyObjectId?.fileId).toBeInstanceOf(ObjectId);
    expect(invalidString?.fileId).toBe('not-an-objectid');
    expect(await getSuggestion(ids.suggestionD)).toBeNull();
  });
});
