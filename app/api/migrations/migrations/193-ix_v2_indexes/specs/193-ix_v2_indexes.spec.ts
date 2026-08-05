import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

const isNamespaceMissingError = (error: unknown) =>
  (error as { codeName?: string })?.codeName === 'NamespaceNotFound' ||
  (error as Error)?.message?.includes('ns does not exist');

const dropCollectionIfExists = async (collectionName: string) => {
  try {
    await db?.collection(collectionName).drop();
  } catch (error) {
    if (!isNamespaceMissingError(error)) {
      throw error;
    }
  }
};

const getIndex = async (collectionName: string, indexName: string) => {
  const indexes = await db?.collection(collectionName).listIndexes().toArray();
  return indexes?.find(index => index.name === indexName);
};

const initTest = async () => {
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
  await migration.up(db);
};

afterAll(async () => {
  await testingDB.tearDown();
});

describe('193-ix_v2_indexes migration', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await initTest();
  });

  it('should have expected metadata', () => {
    expect(migration.delta).toBe(193);
    expect(migration.reindex).toBe(false);
  });

  it('creates segmentations fileID+status index', async () => {
    const index = await getIndex('segmentations', 'fileID_status');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ fileID: 1, status: 1 });
  });

  it('creates segmentations filename+status index', async () => {
    const index = await getIndex('segmentations', 'filename_status');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ filename: 1, status: 1 });
  });

  it('creates segmentations xmlname index', async () => {
    const index = await getIndex('segmentations', 'xmlname_1');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ xmlname: 1 });
  });

  it('creates ixsuggestions extractorId+entityId+language index', async () => {
    const index = await getIndex('ixsuggestions', 'extractorId_entityId_language');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ extractorId: 1, entityId: 1, language: 1 });
  });

  it('creates ixsuggestions extractorId+entityId+fileId index', async () => {
    const index = await getIndex('ixsuggestions', 'extractorId_entityId_fileId');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ extractorId: 1, entityId: 1, fileId: 1 });
  });

  it('creates ixsuggestions extractorId+fileId index', async () => {
    const index = await getIndex('ixsuggestions', 'extractorId_fileId');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ extractorId: 1, fileId: 1 });
  });

  it('creates ixsuggestions extractorId index', async () => {
    const index = await getIndex('ixsuggestions', 'extractorId_1');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ extractorId: 1 });
  });

  it('creates entities sharedId+language index', async () => {
    const index = await getIndex('entities', 'sharedId_language');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ sharedId: 1, language: 1 });
  });

  it('creates all indexes even when collections do not exist', async () => {
    await dropCollectionIfExists('segmentations');
    await dropCollectionIfExists('ixsuggestions');
    await dropCollectionIfExists('entities');

    await migration.up(db!);

    expect(await getIndex('segmentations', 'fileID_status')).toBeDefined();
    expect(await getIndex('segmentations', 'filename_status')).toBeDefined();
    expect(await getIndex('segmentations', 'xmlname_1')).toBeDefined();
    expect(await getIndex('ixsuggestions', 'extractorId_entityId_language')).toBeDefined();
    expect(await getIndex('ixsuggestions', 'extractorId_entityId_fileId')).toBeDefined();
    expect(await getIndex('ixsuggestions', 'extractorId_fileId')).toBeDefined();
    expect(await getIndex('ixsuggestions', 'extractorId_1')).toBeDefined();
    expect(await getIndex('entities', 'sharedId_language')).toBeDefined();
  });
});
