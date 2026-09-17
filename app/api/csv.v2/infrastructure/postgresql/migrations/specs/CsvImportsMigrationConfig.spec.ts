/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { CsvImportsMigrationConfig } from '../CsvImportsMigrationConfig.js';

const importDoc = (id: ObjectId) => ({
  _id: id,
  templateId: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
  status: 'queued',
  createdBy: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
  createdAt: 1700000000,
  updatedAt: 1700000001,
  filesCleanup: 'pending',
  file: { originalName: 'people.csv', mimeType: 'text/csv', size: 12 },
  storage: { path: 'csv-imports/a/original.csv', provider: 'local' },
  stats: { rowsProcessed: 3 },
  progress: { totalRows: 3, processedRows: 1, lastProcessedRow: 0, batchSize: 50 },
  extraction: { sourceType: 'csv', originalUploadSizeBytes: 12, extractedFilesCount: 1, files: [] },
  failure: { message: 'boom', retryable: false, at: 1700000002, stage: 'import:entities' },
  rowErrors: { count: 1 },
});

describe('CsvImportsMigrationConfig', () => {
  it('should map a mongo csv_imports doc onto csv_imports columns and preserve _id', () => {
    const id = new ObjectId();
    const mapped = CsvImportsMigrationConfig.mapDocument(importDoc(id));

    expect(CsvImportsMigrationConfig.mongoCollection).toBe('csv_imports');
    expect(CsvImportsMigrationConfig.pgTable).toBe('csv_imports');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      template_id: '64a1b2c3d4e5f6a7b8c9d0e1',
      status: 'queued',
      created_by: '64a1b2c3d4e5f6a7b8c9d0e2',
      created_at: 1700000000,
      updated_at: 1700000001,
      files_cleanup: 'pending',
      file: { originalName: 'people.csv', mimeType: 'text/csv', size: 12 },
      storage: { path: 'csv-imports/a/original.csv', provider: 'local' },
      stats: { rowsProcessed: 3 },
      progress: { totalRows: 3, processedRows: 1, lastProcessedRow: 0, batchSize: 50 },
      extraction: {
        sourceType: 'csv',
        originalUploadSizeBytes: 12,
        extractedFilesCount: 1,
        files: [],
      },
      failure: { message: 'boom', retryable: false, at: 1700000002, stage: 'import:entities' },
      row_errors: { count: 1 },
    });
  });

  it('should stringify a non-ObjectId _id and null missing optional blobs', () => {
    const mapped = CsvImportsMigrationConfig.mapDocument({
      _id: 'abc123',
      templateId: 'template-1',
      status: 'completed',
      createdBy: 'user-1',
      createdAt: 1,
      updatedAt: 2,
      file: { originalName: 'a.csv', mimeType: 'text/csv', size: 1 },
    });

    expect(mapped).toEqual({
      _id: 'abc123',
      template_id: 'template-1',
      status: 'completed',
      created_by: 'user-1',
      created_at: 1,
      updated_at: 2,
      files_cleanup: null,
      file: { originalName: 'a.csv', mimeType: 'text/csv', size: 1 },
      storage: null,
      stats: null,
      progress: null,
      extraction: null,
      failure: null,
      row_errors: null,
    });
  });
});

describe('CsvImportsMigrationConfig copy', () => {
  const TENANT = 'csv-imports-migration-tenant';
  const OTHER_TENANT = 'csv-imports-migration-other';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['csv_imports']);
    await testingPG.clear(['csv_imports']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = (tenant = TENANT) =>
    new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), tenant);

  it('should copy an import keeping nested blobs in jsonb columns', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('csv_imports').insertOne(importDoc(id));

    expect(await makeMigrator().migrate(CsvImportsMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });

    const rows = (await testingPG.getAllFrom('csv_imports')).filter(
      row => row.tenant_id === TENANT
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: id.toHexString(),
      template_id: '64a1b2c3d4e5f6a7b8c9d0e1',
      status: 'queued',
      created_by: '64a1b2c3d4e5f6a7b8c9d0e2',
      files_cleanup: 'pending',
      file: { originalName: 'people.csv', mimeType: 'text/csv', size: 12 },
      storage: { path: 'csv-imports/a/original.csv', provider: 'local' },
      stats: { rowsProcessed: 3 },
    });
  });

  it('should skip when the Postgres table already has data for the tenant', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('csv_imports').insertOne(importDoc(id));
    await makeMigrator().migrate(CsvImportsMigrationConfig);

    expect(await makeMigrator().migrate(CsvImportsMigrationConfig)).toEqual({
      migrated: 0,
      orphansSkipped: 0,
      skipped: true,
    });
    expect(
      (await testingPG.getAllFrom('csv_imports')).filter(row => row.tenant_id === TENANT)
    ).toHaveLength(1);
  });

  it('should leave an existing tenant row untouched when forced', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('csv_imports').insertOne(importDoc(id));
    await testingPG.pool!.query(
      `INSERT INTO csv_imports
         ("_id", "tenant_id", "template_id", "status", "created_by", "created_at", "updated_at", "file")
       VALUES ($1, $2, 'already', 'completed', 'user', 1, 1, '{"originalName": "old.csv", "mimeType": "text/csv", "size": 1}')`,
      [id.toHexString(), TENANT]
    );

    expect(await makeMigrator().migrate(CsvImportsMigrationConfig, { force: true })).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });

    const rows = (await testingPG.getAllFrom('csv_imports')).filter(
      row => row.tenant_id === TENANT
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].template_id).toBe('already');
    expect(rows[0].status).toBe('completed');
  });

  it('should stamp tenant_id so two tenants can keep the same import _id', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('csv_imports').insertOne(importDoc(id));

    expect(await makeMigrator(TENANT).migrate(CsvImportsMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await makeMigrator(OTHER_TENANT).migrate(CsvImportsMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });

    const rows = await testingPG.getAllFrom('csv_imports');
    expect(rows.map(row => row.tenant_id).sort()).toEqual([OTHER_TENANT, TENANT]);
    expect(rows.every(row => row._id === id.toHexString())).toBe(true);
  });
});
