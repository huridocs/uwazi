import { Db } from 'mongodb';

import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

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

describe('192-csv_v2_indexes migration', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await initTest();
  });

  it('should have expected metadata', () => {
    expect(migration.delta).toBe(192);
    expect(migration.reindex).toBe(false);
  });

  it('creates csv_imports createdAt descending index', async () => {
    const index = await getIndex('csv_imports', 'createdAt_desc');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ createdAt: -1 });
  });

  it('creates csv_import_rows unique importId+rowIndex index', async () => {
    const index = await getIndex('csv_import_rows', 'importId_rowIndex_unique');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ importId: 1, rowIndex: 1 });
    expect(index?.unique).toBe(true);
  });

  it('creates csv_import_row_errors importId+rowIndex index', async () => {
    const index = await getIndex('csv_import_row_errors', 'importId_rowIndex');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ importId: 1, rowIndex: 1 });
  });

  it('creates csv_import_thesauri_values unique importId+thesaurusId index', async () => {
    const index = await getIndex('csv_import_thesauri_values', 'importId_thesaurusId_unique');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ importId: 1, thesaurusId: 1 });
    expect(index?.unique).toBe(true);
  });

  it('creates csv_import_relationships_pending_values unique importId+templateId index', async () => {
    const index = await getIndex(
      'csv_import_relationships_pending_values',
      'importId_templateId_unique'
    );
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ importId: 1, templateId: 1 });
    expect(index?.unique).toBe(true);
  });

  it('creates csv_import_relationships_values unique importId+templateId index', async () => {
    const index = await getIndex('csv_import_relationships_values', 'importId_templateId_unique');
    expect(index).toBeDefined();
    expect(index?.key).toEqual({ importId: 1, templateId: 1 });
    expect(index?.unique).toBe(true);
  });
});
