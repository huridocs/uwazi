import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { Fixture } from '../types.js';
import {
  fixtures,
  processedPdfForMissingAll,
  processedPdfForMissingEntity,
  processedPdfForMissingOriginalnameDoc,
  thumbnailCompleteId,
  thumbnailInvalidObjectIdId,
  thumbnailMissingAllId,
  thumbnailMissingEntityId,
  thumbnailMissingOriginalnameId,
  thumbnailNoMatchingPdfId,
} from './fixtures.js';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration fix-missing-fields-on-thumbnails', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(185);
  });

  it('should check if a reindex is needed', () => {
    expect(migration.reindex).toBe(false);
  });

  it('should not modify a thumbnail that already has all required fields', async () => {
    const thumbnail = await db!.collection('files').findOne({ _id: thumbnailCompleteId });
    expect(thumbnail).not.toBeNull();
    expect(thumbnail!.entity).toBe('entity-complete');
    expect(thumbnail!.language).toBe('eng');
    expect(thumbnail!.originalname).toBeDefined();
    expect(thumbnail!.mimetype).toBe('image/jpeg');
  });

  it('should fix a thumbnail missing all fields (entity, language, originalname, mimetype)', async () => {
    const thumbnail = await db!.collection('files').findOne({ _id: thumbnailMissingAllId });
    expect(thumbnail).not.toBeNull();
    expect(thumbnail!.entity).toBe(processedPdfForMissingAll.entity);
    expect(thumbnail!.language).toBe(processedPdfForMissingAll.language);
    expect(thumbnail!.originalname).toBe(processedPdfForMissingAll._id.toHexString() + '.jpg');
    expect(thumbnail!.mimetype).toBe('image/jpeg');
  });

  it('should fix a thumbnail missing only entity', async () => {
    const thumbnail = await db!.collection('files').findOne({ _id: thumbnailMissingEntityId });
    expect(thumbnail).not.toBeNull();
    expect(thumbnail!.entity).toBe(processedPdfForMissingEntity.entity);
    // Pre-existing fields should be preserved
    expect(thumbnail!.language).toBe('fra');
    expect(thumbnail!.mimetype).toBe('image/jpeg');
  });

  it('should fix a thumbnail missing only originalname', async () => {
    const thumbnail = await db!
      .collection('files')
      .findOne({ _id: thumbnailMissingOriginalnameId });
    expect(thumbnail).not.toBeNull();
    expect(thumbnail!.originalname).toBe(
      processedPdfForMissingOriginalnameDoc._id.toHexString() + '.jpg'
    );
    // Pre-existing fields should be preserved
    expect(thumbnail!.entity).toBe('entity-missing-originalname');
    expect(thumbnail!.language).toBe('deu');
    expect(thumbnail!.mimetype).toBe('image/jpeg');
  });

  it('should delete a thumbnail whose filename does not match any processed PDF', async () => {
    const thumbnail = await db!.collection('files').findOne({ _id: thumbnailNoMatchingPdfId });
    expect(thumbnail).toBeNull();
  });

  it('should delete a thumbnail whose filename is not a valid ObjectId', async () => {
    const thumbnail = await db!.collection('files').findOne({ _id: thumbnailInvalidObjectIdId });
    expect(thumbnail).toBeNull();
  });
});
