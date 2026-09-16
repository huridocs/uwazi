/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '#api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.js';
import { CsvImportRowsMigrationConfig } from '../CsvImportRowsMigrationConfig.js';
import { CsvImportRowErrorsMigrationConfig } from '../CsvImportRowErrorsMigrationConfig.js';
import { CsvImportThesauriValuesMigrationConfig } from '../CsvImportThesauriValuesMigrationConfig.js';
import { CsvImportRelationshipPendingValuesMigrationConfig } from '../CsvImportRelationshipPendingValuesMigrationConfig.js';
import { CsvImportRelationshipValuesMigrationConfig } from '../CsvImportRelationshipValuesMigrationConfig.js';

const TENANT = 'csv-child-migration-tenant';

const makeMigrator = () =>
  new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT);

const rowsForTenant = async (table: string) =>
  (await testingPG.getAllFrom(table)).filter(row => row.tenant_id === TENANT);

describe('CsvImportRowsMigrationConfig', () => {
  it('should map a mongo row onto csv_import_rows columns and preserve _id', () => {
    const id = new ObjectId();
    const importId = new ObjectId();
    const mapped = CsvImportRowsMigrationConfig.mapDocument({
      _id: id,
      importId,
      rowIndex: 3,
      headers: ['title'],
      values: ['Ada'],
    });

    expect(CsvImportRowsMigrationConfig.mongoCollection).toBe('csv_import_rows');
    expect(CsvImportRowsMigrationConfig.pgTable).toBe('csv_import_rows');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      import_id: importId.toHexString(),
      row_index: 3,
      headers: ['title'],
      values: ['Ada'],
    });
  });
});

describe('CsvImportRowErrorsMigrationConfig', () => {
  it('should map a mongo error onto csv_import_row_errors columns and preserve _id', () => {
    const id = new ObjectId();
    const mapped = CsvImportRowErrorsMigrationConfig.mapDocument({
      _id: id,
      importId: 'import-1',
      rowIndex: 2,
      message: 'required',
      code: 'VALUE_REQUIRED',
      property: 'title',
      rawValue: '',
      details: { column: 'title' },
      createdAt: 1700000000,
    });

    expect(CsvImportRowErrorsMigrationConfig.mongoCollection).toBe('csv_import_row_errors');
    expect(CsvImportRowErrorsMigrationConfig.pgTable).toBe('csv_import_row_errors');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      import_id: 'import-1',
      row_index: 2,
      message: 'required',
      code: 'VALUE_REQUIRED',
      property: 'title',
      raw_value: '',
      details: { column: 'title' },
      created_at: 1700000000,
    });
  });

  it('should null missing optional error fields', () => {
    const mapped = CsvImportRowErrorsMigrationConfig.mapDocument({
      _id: 'err-1',
      importId: 'import-1',
      rowIndex: 0,
      message: 'bad',
      code: 'VALUE_REQUIRED',
      createdAt: 1,
    });

    expect(mapped).toMatchObject({
      property: null,
      raw_value: null,
      details: null,
    });
  });
});

describe('CsvImportThesauriValuesMigrationConfig', () => {
  it('should map a mongo thesauri-values doc onto csv_import_thesauri_values columns', () => {
    const id = new ObjectId();
    const mapped = CsvImportThesauriValuesMigrationConfig.mapDocument({
      _id: id,
      importId: 'import-1',
      thesaurusId: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'),
      entries: [{ label: 'Red' }],
      createdAt: 1700000000,
      appliedAt: 1700000001,
      appliedValues: [{ label: 'Red', valueId: 'v1' }],
      stats: { valuesObserved: 1, valuesCreated: 1 },
    });

    expect(CsvImportThesauriValuesMigrationConfig.mongoCollection).toBe(
      'csv_import_thesauri_values'
    );
    expect(CsvImportThesauriValuesMigrationConfig.pgTable).toBe('csv_import_thesauri_values');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      import_id: 'import-1',
      thesaurus_id: '64a1b2c3d4e5f6a7b8c9d0e3',
      entries: [{ label: 'Red' }],
      created_at: 1700000000,
      applied_at: 1700000001,
      applied_values: [{ label: 'Red', valueId: 'v1' }],
      stats: { valuesObserved: 1, valuesCreated: 1 },
    });
  });

  it('should null missing applied fields', () => {
    const mapped = CsvImportThesauriValuesMigrationConfig.mapDocument({
      _id: 'th-1',
      importId: 'import-1',
      thesaurusId: 'th',
      entries: [],
      createdAt: 1,
    });

    expect(mapped).toMatchObject({
      applied_at: null,
      applied_values: null,
      stats: null,
    });
  });
});

describe('CsvImportRelationshipPendingValuesMigrationConfig', () => {
  it('should map a mongo pending-relationship doc onto its table columns', () => {
    const id = new ObjectId();
    const mapped = CsvImportRelationshipPendingValuesMigrationConfig.mapDocument({
      _id: id,
      importId: 'import-1',
      templateId: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'),
      titles: ['Ada'],
      createdAt: 1700000000,
    });

    expect(CsvImportRelationshipPendingValuesMigrationConfig.mongoCollection).toBe(
      'csv_import_relationships_pending_values'
    );
    expect(CsvImportRelationshipPendingValuesMigrationConfig.pgTable).toBe(
      'csv_import_relationships_pending_values'
    );
    expect(mapped).toEqual({
      _id: id.toHexString(),
      import_id: 'import-1',
      template_id: '64a1b2c3d4e5f6a7b8c9d0e4',
      titles: ['Ada'],
      created_at: 1700000000,
    });
  });
});

describe('CsvImportRelationshipValuesMigrationConfig', () => {
  it('should map a mongo relationship-values doc onto its table columns', () => {
    const id = new ObjectId();
    const mapped = CsvImportRelationshipValuesMigrationConfig.mapDocument({
      _id: id,
      importId: 'import-1',
      templateId: 'template-1',
      values: [{ label: 'Ada', matches: [{ sharedId: 's1', templateId: 't1' }] }],
      createdAt: 1700000000,
    });

    expect(CsvImportRelationshipValuesMigrationConfig.mongoCollection).toBe(
      'csv_import_relationships_values'
    );
    expect(CsvImportRelationshipValuesMigrationConfig.pgTable).toBe(
      'csv_import_relationships_values'
    );
    expect(mapped).toEqual({
      _id: id.toHexString(),
      import_id: 'import-1',
      template_id: 'template-1',
      values: [{ label: 'Ada', matches: [{ sharedId: 's1', templateId: 't1' }] }],
      created_at: 1700000000,
    });
  });
});

describe('CSV child collection copy', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear([
      'csv_import_rows',
      'csv_import_row_errors',
      'csv_import_thesauri_values',
      'csv_import_relationships_pending_values',
      'csv_import_relationships_values',
    ]);
    await testingPG.clear([
      'csv_import_rows',
      'csv_import_row_errors',
      'csv_import_thesauri_values',
      'csv_import_relationships_pending_values',
      'csv_import_relationships_values',
    ]);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy a csv_import_rows document preserving _id', async () => {
    const id = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('csv_import_rows')
      .insertOne({
        _id: id,
        importId: 'import-1',
        rowIndex: 0,
        headers: ['title'],
        values: ['Ada'],
      });

    expect(await makeMigrator().migrate(CsvImportRowsMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await rowsForTenant('csv_import_rows')).toEqual([
      expect.objectContaining({
        _id: id.toHexString(),
        import_id: 'import-1',
        row_index: 0,
        headers: ['title'],
        values: ['Ada'],
      }),
    ]);
  });

  it('should copy a csv_import_row_errors document preserving _id', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('csv_import_row_errors').insertOne({
      _id: id,
      importId: 'import-1',
      rowIndex: 0,
      message: 'required',
      code: 'VALUE_REQUIRED',
      createdAt: 1700000000,
    });

    expect(await makeMigrator().migrate(CsvImportRowErrorsMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await rowsForTenant('csv_import_row_errors')).toEqual([
      expect.objectContaining({
        _id: id.toHexString(),
        import_id: 'import-1',
        row_index: 0,
        message: 'required',
        code: 'VALUE_REQUIRED',
        created_at: 1700000000,
      }),
    ]);
  });

  it('should copy a csv_import_thesauri_values document preserving _id', async () => {
    const id = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('csv_import_thesauri_values')
      .insertOne({
        _id: id,
        importId: 'import-1',
        thesaurusId: 'th-1',
        entries: [{ label: 'Red' }],
        createdAt: 1700000000,
      });

    expect(await makeMigrator().migrate(CsvImportThesauriValuesMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await rowsForTenant('csv_import_thesauri_values')).toEqual([
      expect.objectContaining({
        _id: id.toHexString(),
        import_id: 'import-1',
        thesaurus_id: 'th-1',
        entries: [{ label: 'Red' }],
      }),
    ]);
  });

  it('should copy a pending-relationship document preserving _id', async () => {
    const id = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('csv_import_relationships_pending_values')
      .insertOne({
        _id: id,
        importId: 'import-1',
        templateId: 'template-1',
        titles: ['Ada'],
        createdAt: 1700000000,
      });

    expect(await makeMigrator().migrate(CsvImportRelationshipPendingValuesMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await rowsForTenant('csv_import_relationships_pending_values')).toEqual([
      expect.objectContaining({
        _id: id.toHexString(),
        import_id: 'import-1',
        template_id: 'template-1',
        titles: ['Ada'],
      }),
    ]);
  });

  it('should copy a relationship-values document preserving _id', async () => {
    const id = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('csv_import_relationships_values')
      .insertOne({
        _id: id,
        importId: 'import-1',
        templateId: 'template-1',
        values: [{ label: 'Ada', matches: [] }],
        createdAt: 1700000000,
      });

    expect(await makeMigrator().migrate(CsvImportRelationshipValuesMigrationConfig)).toEqual({
      migrated: 1,
      orphansSkipped: 0,
      skipped: false,
    });
    expect(await rowsForTenant('csv_import_relationships_values')).toEqual([
      expect.objectContaining({
        _id: id.toHexString(),
        import_id: 'import-1',
        template_id: 'template-1',
        values: [{ label: 'Ada', matches: [] }],
      }),
    ]);
  });
});
