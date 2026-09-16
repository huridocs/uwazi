/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres, MigrationConfig } from '../MigrateCollectionToPostgres.js';
import {
  FilesMigrationConfig,
  IXExtractorsMigrationConfig,
  IXModelsMigrationConfig,
  IXSuggestionsMigrationConfig,
} from '../configs/index.js';

describe('MigrateCollectionToPostgres', () => {
  const TENANT = 'migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['dictionaries']);
    await testingPG.clear(['thesauri']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should migrate all documents from a MongoDB collection to PostgreSQL table', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('dictionaries').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        name: 'Countries',
        values: [{ id: 'v1', label: 'Argentina' }],
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
        name: 'Fruits',
        values: [{ id: 'v2', label: 'Apple' }],
      },
    ]);

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
        return {
          _id,
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migrator = makeMigrator();
    const result = await migrator.migrate(config);

    expect(result.migrated).toBe(2);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(2);
    expect(rowsForTenant.every(r => r.tenant_id === TENANT)).toBe(true);

    const byId = Object.fromEntries(rowsForTenant.map(r => [r._id, r]));
    expect(byId['64a1b2c3d4e5f6a7b8c9d0e1'].name).toBe('Countries');
    expect(byId['64a1b2c3d4e5f6a7b8c9d0e2'].name).toBe('Fruits');
  });

  it('should isolate different tenants', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);

    await mongoDb.collection('dictionaries').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e5'),
      name: 'Animals',
      values: [{ id: 'v5', label: 'Dog' }],
    });

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
        return {
          _id,
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migratorA = new MigrateCollectionToPostgres(mongoDb, 'tenant-a');
    const resultA = await migratorA.migrate(config);
    expect(resultA.migrated).toBe(1);
    expect(resultA.skipped).toBe(false);

    const migratorB = new MigrateCollectionToPostgres(mongoDb, 'tenant-b');
    const resultB = await migratorB.migrate(config);
    expect(resultB.migrated).toBe(1);
    expect(resultB.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForA = pgRows.filter(r => r.tenant_id === 'tenant-a');
    const rowsForB = pgRows.filter(r => r.tenant_id === 'tenant-b');

    expect(rowsForA).toHaveLength(1);
    expect(rowsForB).toHaveLength(1);
    expect(rowsForA.every(r => r.tenant_id === 'tenant-a')).toBe(true);
    expect(rowsForB.every(r => r.tenant_id === 'tenant-b')).toBe(true);
    expect(rowsForA[0]._id).toBe('64a1b2c3d4e5f6a7b8c9d0e5');
    expect(rowsForB[0]._id).toBe('64a1b2c3d4e5f6a7b8c9d0e5');
  });

  it('should return 0 when MongoDB collection is empty', async () => {
    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        return {
          _id: doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id),
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migrator = makeMigrator();
    const result = await migrator.migrate(config);
    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    expect(pgRows.filter(r => r.tenant_id === TENANT)).toHaveLength(0);
  });

  it('should batch insert correctly', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const docs = Array.from({ length: 250 }, (_, i) => ({
      _id: new ObjectId(),
      name: `Thesaurus ${i}`,
      values: [{ id: `v${i}`, label: `Label ${i}` }],
    }));

    await mongoDb.collection('dictionaries').insertMany(docs);

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        return {
          _id: doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id),
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migrator = makeMigrator();
    const result = await migrator.migrate(config);
    expect(result.migrated).toBe(250);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(250);
    expect(rowsForTenant.every(r => r.tenant_id === TENANT)).toBe(true);
  });

  it('should use ThesaurusMigrationConfig successfully', async () => {
    const { ThesaurusMigrationConfig } =
      await import('#api/core/infrastructure/postgresql/migrations/configs/ThesaurusMigrationConfig.js');

    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('dictionaries').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e6'),
      name: 'Regions',
      values: [
        {
          id: 'g1',
          label: 'Europe',
          values: [
            { id: 'sg1', label: 'France' },
            { id: 'sg2', label: 'Germany' },
          ],
        },
      ],
    });

    const migrator = makeMigrator();
    const result = await migrator.migrate(ThesaurusMigrationConfig);
    expect(result.migrated).toBe(1);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(1);
    expect(rowsForTenant.every(r => r.tenant_id === TENANT)).toBe(true);

    const row = rowsForTenant.find(r => r._id === '64a1b2c3d4e5f6a7b8c9d0e6');
    expect(row).toBeDefined();
    expect(row!.name).toBe('Regions');
    expect(row!.values).toEqual([
      {
        id: 'g1',
        label: 'Europe',
        values: [
          { id: 'sg1', label: 'France' },
          { id: 'sg2', label: 'Germany' },
        ],
      },
    ]);
  });

  it('should skip and count documents whose parent reference is not in the parent collection', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await testingDB.clear(['templates']);
    await mongoDb
      .collection('templates')
      .insertMany([
        { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9a001') },
        { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9a002') },
      ]);
    await mongoDb.collection('dictionaries').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f1'),
        name: 'Parent as ObjectId',
        parent: new ObjectId('64a1b2c3d4e5f6a7b8c9a001'),
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f2'),
        name: 'Parent as hex string',
        parent: '64a1b2c3d4e5f6a7b8c9a002',
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f3'),
        name: 'Orphan',
        parent: new ObjectId('64a1b2c3d4e5f6a7b8c9a999'),
      },
    ]);

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      excludeOrphansOf: { field: 'parent', collection: 'templates' },
      mapDocument(doc: Record<string, unknown>) {
        return { _id: String(doc._id), name: doc.name, values: JSON.stringify([]) };
      },
    };

    const result = await makeMigrator().migrate(config);

    expect(result).toEqual({ migrated: 2, orphansSkipped: 1, skipped: false });
    const rowsForTenant = (await testingPG.getAllFrom('thesauri')).filter(
      r => r.tenant_id === TENANT
    );
    expect(rowsForTenant.map(r => r.name).sort()).toEqual([
      'Parent as ObjectId',
      'Parent as hex string',
    ]);
  });

  it('should skip migration when PostgreSQL table already contains data for tenant', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);

    await testingPG.setFixtures({
      thesauri: [
        {
          _id: '64a1b2c3d4e5f6a7b8c9d0e7',
          name: 'Existing',
          values: JSON.stringify([{ id: 'v1', label: 'Existing' }]),
          tenant_id: TENANT,
        },
      ],
    });

    await mongoDb.collection('dictionaries').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e8'),
        name: 'New',
        values: [{ id: 'v2', label: 'New' }],
      },
    ]);

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        return {
          _id: doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id),
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migrator = makeMigrator();
    const result = await migrator.migrate(config);

    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(true);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(1);
    expect(rowsForTenant[0].name).toBe('Existing');
  });

  it('should migrate when forced even if PostgreSQL table already contains data for tenant', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);

    await testingPG.setFixtures({
      thesauri: [
        {
          _id: '64a1b2c3d4e5f6a7b8c9d0e7',
          name: 'Existing',
          values: JSON.stringify([{ id: 'v1', label: 'Existing' }]),
          tenant_id: TENANT,
        },
      ],
    });

    await mongoDb.collection('dictionaries').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e7'),
        name: 'Existing Updated',
        values: [{ id: 'v1', label: 'Existing Updated' }],
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e8'),
        name: 'New',
        values: [{ id: 'v2', label: 'New' }],
      },
    ]);

    const config: MigrationConfig = {
      mongoCollection: 'dictionaries',
      pgTable: 'thesauri',
      mapDocument(doc: Record<string, unknown>) {
        return {
          _id: doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id),
          name: doc.name,
          values: JSON.stringify(doc.values ?? []),
        };
      },
    };

    const migrator = makeMigrator();
    const result = await migrator.migrate(config, { force: true });

    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(2);

    const existing = rowsForTenant.find(r => r._id === '64a1b2c3d4e5f6a7b8c9d0e7');
    expect(existing).toBeDefined();
    expect(existing!.name).toBe('Existing');

    const added = rowsForTenant.find(r => r._id === '64a1b2c3d4e5f6a7b8c9d0e8');
    expect(added).toBeDefined();
    expect(added!.name).toBe('New');
  });

  describe('FilesMigrationConfig', () => {
    beforeEach(async () => {
      await testingDB.clear(['files']);
      await testingPG.clear(['files']);
    });

    it('should migrate document files with all fields', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('files').insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d100'),
        originalname: 'document.pdf',
        filename: '1234567890.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        creationDate: 1690000000000,
        type: 'document',
        entity: 'entity123',
        status: 'ready',
        totalPages: 15,
        language: 'eng',
        generatedToc: true,
        toc: [{ label: 'Chapter 1', id: 'ch1', indentation: 0 }],
        fullText: { eng: 'Full text content here' },
        propertySelections: [{ property: 'prop1', selections: ['sel1'] }],
      });

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(false);

      const pgRows = await testingPG.getAllFrom('files');
      const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
      expect(rowsForTenant).toHaveLength(1);

      expect(rowsForTenant[0]).toMatchObject({
        _id: '64a1b2c3d4e5f6a7b8c9d100',
        originalname: 'document.pdf',
        filename: '1234567890.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        creationDate: 1690000000000,
        type: 'document',
        entity: 'entity123',
        status: 'ready',
        totalPages: 15,
        language: 'eng',
        generatedToc: true,
        toc: [{ label: 'Chapter 1', id: 'ch1', indentation: 0 }],
        fullText: { eng: 'Full text content here' },
        propertySelections: [{ property: 'prop1', selections: ['sel1'] }],
      });
    });

    it('should migrate processing PDF document with null optional fields', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('files').insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d101'),
        originalname: 'processing.pdf',
        filename: '9999999999.pdf',
        mimetype: 'application/pdf',
        size: 500000,
        creationDate: 1690000000000,
        type: 'document',
        entity: 'entity456',
        status: 'processing',
      });

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(1);

      const pgRows = await testingPG.getAllFrom('files');
      const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

      expect(row).toMatchObject({
        entity: 'entity456',
        status: 'processing',
        totalPages: null,
        language: null,
        generatedToc: null,
        toc: null,
        fullText: null,
        propertySelections: null,
        url: null,
      });
    });

    it('should migrate attachment files with url field', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('files').insertMany([
        {
          _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d102'),
          originalname: 'report.pdf',
          filename: '1111111111.pdf',
          mimetype: 'application/pdf',
          size: 200000,
          creationDate: 1690000000000,
          type: 'attachment',
          entity: 'entity789',
        },
        {
          _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d103'),
          originalname: 'link',
          filename: '',
          mimetype: 'text/url',
          size: 0,
          creationDate: 1690000000000,
          type: 'attachment',
          entity: 'entity789',
          url: 'https://example.com/resource',
        },
      ]);

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(2);

      const pgRows = await testingPG.getAllFrom('files');
      const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
      expect(rowsForTenant).toHaveLength(2);

      const attachment = rowsForTenant.find(r => r.originalname === 'report.pdf');
      expect(attachment).toEqual(expect.objectContaining({ type: 'attachment', url: null }));

      const urlAttachment = rowsForTenant.find(r => r.originalname === 'link');
      expect(urlAttachment).toMatchObject({ url: 'https://example.com/resource' });
    });

    it('should migrate custom files', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('files').insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d104'),
        originalname: 'custom.css',
        filename: 'custom.css',
        mimetype: 'text/css',
        size: 1024,
        creationDate: 1690000000000,
        type: 'custom',
      });

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(1);

      const pgRows = await testingPG.getAllFrom('files');
      const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

      expect(row).toMatchObject({ type: 'custom', entity: null, status: null, url: null });
    });

    it('should migrate thumbnail files', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('files').insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d105'),
        originalname: 'thumbnail.jpg',
        filename: 'thumb_123.jpg',
        mimetype: 'image/jpeg',
        size: 50000,
        creationDate: 1690000000000,
        type: 'thumbnail',
        entity: 'entity101',
        language: 'spa',
      });

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(1);

      const pgRows = await testingPG.getAllFrom('files');
      const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

      expect(row).toMatchObject({
        type: 'thumbnail',
        entity: 'entity101',
        language: 'spa',
        status: null,
      });
    });

    it('should skip FilesMigrationConfig when PostgreSQL files table already has data', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);

      await testingPG.setFixtures({
        files: [
          {
            _id: '64a1b2c3d4e5f6a7b8c9d110',
            originalname: 'existing.pdf',
            filename: 'existing.pdf',
            mimetype: 'application/pdf',
            size: 1000,
            creationDate: 1690000000000,
            type: 'document',
            entity: null,
            status: null,
            language: null,
            totalPages: null,
            fullText: null,
            generatedToc: null,
            propertySelections: null,
            toc: null,
            url: null,
            tenant_id: TENANT,
          },
        ],
      });

      await mongoDb.collection('files').insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d111'),
        originalname: 'new.pdf',
        filename: 'new.pdf',
        mimetype: 'application/pdf',
        size: 2000,
        creationDate: 1690000000000,
        type: 'document',
        entity: 'entity202',
        status: 'ready',
      });

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(0);
      expect(result.skipped).toBe(true);

      const pgRows = await testingPG.getAllFrom('files');
      const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
      expect(rowsForTenant).toHaveLength(1);
      expect(rowsForTenant[0]).toMatchObject({ originalname: 'existing.pdf' });
    });

    it('should migrate multiple file types in batch', async () => {
      const mongoDb = testingDB.db(testingDB.dbName);
      const files = Array.from({ length: 100 }, (_, i) => ({
        _id: new ObjectId(),
        originalname: `file_${i}.pdf`,
        filename: `${i}.pdf`,
        mimetype: 'application/pdf',
        size: 1000 + i,
        creationDate: 1690000000000 + i,
        type: i % 2 === 0 ? 'document' : 'attachment',
        entity: `entity_${i}`,
        status: i % 2 === 0 ? ('ready' as const) : null,
        totalPages: i % 2 === 0 ? i + 1 : null,
        language: i % 2 === 0 ? ('eng' as const) : null,
        generatedToc: i % 2 === 0 ? true : null,
      }));

      await mongoDb.collection('files').insertMany(files);

      const migrator = makeMigrator();
      const result = await migrator.migrate(FilesMigrationConfig);

      expect(result.migrated).toBe(100);
      expect(result.skipped).toBe(false);

      const pgRows = await testingPG.getAllFrom('files');
      const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
      expect(rowsForTenant).toHaveLength(100);
    });
  });

  /**
   * The three IX tables are copied in foreign key order: models and suggestions reference their
   * extractor, so a run that inserted them first would fail. Orphans, whose extractor is gone from
   * Mongo, are skipped rather than failing the batch.
   */
  describe('IX collections', () => {
    const extractorA = '64a1b2c3d4e5f6a7b8c9e001';
    const extractorB = '64a1b2c3d4e5f6a7b8c9e002';
    const deletedExtractor = '64a1b2c3d4e5f6a7b8c9e0ff';

    const suggestion = (hexId: string, extractorId: string, entityId: string) => ({
      _id: new ObjectId(hexId),
      extractorId: new ObjectId(extractorId),
      entityId,
      entityTemplate: '64a1b2c3d4e5f6a7b8c9e301',
      propertyName: 'target',
      language: 'en',
      suggestedValue: `${entityId} value`,
      status: 'ready',
      date: 1000,
      state: { labeled: false },
    });

    const rowsOf = async (table: string) =>
      (await testingPG.getAllFrom(table)).filter(row => row.tenant_id === TENANT);

    const idsOf = async (table: string) => (await rowsOf(table)).map(row => row._id).sort();

    const migrateIX = async () => {
      const migrator = makeMigrator();
      const extractors = await migrator.migrate(IXExtractorsMigrationConfig);
      const models = await migrator.migrate(IXModelsMigrationConfig);
      const suggestions = await migrator.migrate(IXSuggestionsMigrationConfig);
      return { extractors, models, suggestions };
    };

    beforeEach(async () => {
      await testingDB.clear(['ixextractors', 'ixmodels', 'ixsuggestions']);
      await testingPG.clear(['ix_suggestions', 'ix_models', 'ix_extractors']);

      const mongoDb = testingDB.db(testingDB.dbName);
      await mongoDb.collection('ixextractors').insertMany([
        {
          _id: new ObjectId(extractorA),
          name: 'Text extractor',
          property: 'target',
          source: { property: 'source_text' },
          templates: [new ObjectId('64a1b2c3d4e5f6a7b8c9e301')],
        },
        {
          _id: new ObjectId(extractorB),
          name: 'Pdf extractor',
          property: 'target',
          source: { pdf: true },
          templates: [new ObjectId('64a1b2c3d4e5f6a7b8c9e301')],
        },
      ]);
      await mongoDb.collection('ixmodels').insertMany([
        {
          _id: new ObjectId('64a1b2c3d4e5f6a7b8c9e101'),
          extractorId: new ObjectId(extractorA),
          creationDate: 1000,
          status: 'ready',
          findingSuggestions: false,
        },
        {
          _id: new ObjectId('64a1b2c3d4e5f6a7b8c9e102'),
          extractorId: new ObjectId(deletedExtractor),
          creationDate: 1000,
          status: 'ready',
          findingSuggestions: false,
        },
      ]);
      await mongoDb.collection('ixsuggestions').insertMany([
        suggestion('64a1b2c3d4e5f6a7b8c9e201', extractorA, 'text entity'),
        {
          ...suggestion('64a1b2c3d4e5f6a7b8c9e202', extractorB, 'pdf entity'),
          entityLanguageId: new ObjectId('64a1b2c3d4e5f6a7b8c9e401'),
          fileId: new ObjectId('64a1b2c3d4e5f6a7b8c9e501'),
          selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, page: '1' }],
        },
        suggestion('64a1b2c3d4e5f6a7b8c9e203', deletedExtractor, 'orphan entity'),
      ]);
    });

    it('copies ixextractors, then ixmodels and ixsuggestions, with FKs satisfied', async () => {
      const { extractors } = await migrateIX();

      expect(extractors).toEqual({ migrated: 2, orphansSkipped: 0, skipped: false });
      expect(await idsOf('ix_extractors')).toEqual([extractorA, extractorB]);
      expect(await rowsOf('ix_models')).toMatchObject([
        { _id: '64a1b2c3d4e5f6a7b8c9e101', extractorId: extractorA, status: 'ready' },
      ]);

      const suggestions = await rowsOf('ix_suggestions');
      expect(suggestions.find(row => row.extractorId === extractorA)).toMatchObject({
        _id: '64a1b2c3d4e5f6a7b8c9e201',
        entityId: 'text entity',
        fileId: null,
        suggestedValue: 'text entity value',
      });
      expect(suggestions.find(row => row.extractorId === extractorB)).toMatchObject({
        _id: '64a1b2c3d4e5f6a7b8c9e202',
        entityLanguageId: '64a1b2c3d4e5f6a7b8c9e401',
        fileId: '64a1b2c3d4e5f6a7b8c9e501',
        selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, page: '1' }],
      });
    });

    it('skips the orphan model and the orphan suggestion', async () => {
      const { models, suggestions } = await migrateIX();

      expect(models).toEqual({ migrated: 1, orphansSkipped: 1, skipped: false });
      expect(suggestions).toEqual({ migrated: 2, orphansSkipped: 1, skipped: false });
      expect(await idsOf('ix_models')).toEqual(['64a1b2c3d4e5f6a7b8c9e101']);
      expect(await idsOf('ix_suggestions')).toEqual([
        '64a1b2c3d4e5f6a7b8c9e201',
        '64a1b2c3d4e5f6a7b8c9e202',
      ]);
    });

    it('is idempotent: a second run without force skips non-empty tables', async () => {
      await migrateIX();

      const skipped = { migrated: 0, orphansSkipped: 0, skipped: true };
      expect(await migrateIX()).toEqual({
        extractors: skipped,
        models: skipped,
        suggestions: skipped,
      });
      expect(await idsOf('ix_extractors')).toHaveLength(2);
      expect(await idsOf('ix_models')).toHaveLength(1);
      expect(await idsOf('ix_suggestions')).toHaveLength(2);
    });
  });
});
