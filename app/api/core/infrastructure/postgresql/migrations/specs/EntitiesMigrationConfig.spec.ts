/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../MigrateCollectionToPostgres.js';
import { EntitiesMigrationConfig } from '../configs/EntitiesMigrationConfig.js';

describe('EntitiesMigrationConfig', () => {
  const TENANT = 'entity-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['entities']);
    await testingPG.clear(['entities']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should migrate an entity with all fields populated', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
      sharedId: 'entity-shared-001',
      language: 'eng',
      title: 'Human Rights Report 2024',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a001'),
      published: true,
      generatedToc: true,
      icon: { _id: 'icon-001', label: 'Report', type: 'icon' },
      creationDate: 1700000000000,
      editDate: 1700100000000,
      metadata: {
        date: [{ value: '2024-01-15', label: '2024-01-15' }],
        countries: [{ value: 'country001', label: 'Argentina' }],
      },
      user: new ObjectId('64a1b2c3d4e5f6a7b8c9b001'),
      permissions: [
        { refId: 'user001', type: 'user', level: 'write' },
        { refId: 'group001', type: 'group', level: 'read' },
      ],
      preview: 'https://example.com/preview/001',
      obsoleteMetadata: ['oldField'],
      mongoLanguage: 'english',
      __v: 3,
    });

    const migrator = makeMigrator();
    const result = await migrator.migrate(EntitiesMigrationConfig);

    expect(result.migrated).toBe(1);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(1);

    expect(rowsForTenant[0]).toMatchObject({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      sharedId: 'entity-shared-001',
      language: 'eng',
      title: 'Human Rights Report 2024',
      template: '64a1b2c3d4e5f6a7b8c9a001',
      published: true,
      generatedToc: true,
      icon: { _id: 'icon-001', label: 'Report', type: 'icon' },
      creationDate: 1700000000000,
      editDate: 1700100000000,
      metadata: {
        date: [{ value: '2024-01-15', label: '2024-01-15' }],
        countries: [{ value: 'country001', label: 'Argentina' }],
      },
      user: '64a1b2c3d4e5f6a7b8c9b001',
      permissions: [
        { refId: 'user001', type: 'user', level: 'write' },
        { refId: 'group001', type: 'group', level: 'read' },
      ],
      preview: 'https://example.com/preview/001',
    });
  });

  it('should exclude obsoleteMetadata, mongoLanguage, and __v from output', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
      sharedId: 'entity-shared-002',
      language: 'spa',
      title: 'Entity with excluded fields',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a002'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      obsoleteMetadata: ['field1', 'field2'],
      mongoLanguage: 'spanish',
      __v: 5,
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).not.toHaveProperty('obsoleteMetadata');
    expect(row).not.toHaveProperty('mongoLanguage');
    expect(row).not.toHaveProperty('__v');
  });

  it('should migrate entity with all optional fields null/undefined', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'),
      sharedId: 'entity-shared-003',
      language: 'fra',
      title: 'Minimal Entity',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a003'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    const result = await migrator.migrate(EntitiesMigrationConfig);

    expect(result.migrated).toBe(1);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      _id: '64a1b2c3d4e5f6a7b8c9d0e3',
      sharedId: 'entity-shared-003',
      language: 'fra',
      title: 'Minimal Entity',
      template: '64a1b2c3d4e5f6a7b8c9a003',
      published: false,
      generatedToc: null,
      icon: { _id: null, type: '' },
      user: null,
      permissions: [],
      preview: null,
    });
  });

  it('should convert ObjectId _id to hex string', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const objectId = new ObjectId('64a1b2c3d4e5f6a7b8c9d0e4');
    await mongoDb.collection('entities').insertOne({
      _id: objectId,
      sharedId: 'entity-shared-004',
      language: 'deu',
      title: 'ObjectId Conversion Test',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a004'),
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row._id).toBe(objectId.toHexString());
  });

  it('should convert template ObjectId to hex string', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const templateId = new ObjectId('64a1b2c3d4e5f6a7b8c9a005');
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e5'),
      sharedId: 'entity-shared-005',
      language: 'eng',
      title: 'Template Conversion Test',
      template: templateId,
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row.template).toBe(templateId.toHexString());
  });

  it('should convert user ObjectId to hex string', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const userId = new ObjectId('64a1b2c3d4e5f6a7b8c9b006');
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e6'),
      sharedId: 'entity-shared-006',
      language: 'eng',
      title: 'User Conversion Test',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a006'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      user: userId,
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row.user).toBe(userId.toHexString());
  });

  it('should handle icon with null _id', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e7'),
      sharedId: 'entity-shared-007',
      language: 'eng',
      title: 'Icon Null Id',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a007'),
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      icon: { _id: null, label: 'No Icon', type: 'icon' },
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      icon: { _id: null, label: 'No Icon', type: 'icon' },
    });
  });

  it('should handle icon with string _id', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e8'),
      sharedId: 'entity-shared-008',
      language: 'eng',
      title: 'Icon String Id',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a008'),
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      icon: { _id: 'icon-string-id', label: 'Custom Icon', type: 'svg' },
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      icon: { _id: 'icon-string-id', label: 'Custom Icon', type: 'svg' },
    });
  });

  it('should default icon to empty object when missing', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e9'),
      sharedId: 'entity-shared-009',
      language: 'eng',
      title: 'No Icon Entity',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a009'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      icon: { _id: null, type: '' },
    });
  });

  it('should handle permissions with different types and levels', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0a1'),
      sharedId: 'entity-shared-0a1',
      language: 'eng',
      title: 'Permissions Test',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0a1'),
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      permissions: [
        { refId: 'user-write', type: 'user', level: 'write' },
        { refId: 'user-read', type: 'user', level: 'read' },
        { refId: 'group-mixed', type: 'group', level: 'mixed' },
        { refId: 'public-ref', type: 'public', level: 'read' },
      ],
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      permissions: [
        { refId: 'user-write', type: 'user', level: 'write' },
        { refId: 'user-read', type: 'user', level: 'read' },
        { refId: 'group-mixed', type: 'group', level: 'mixed' },
        { refId: 'public-ref', type: 'public', level: 'read' },
      ],
    });
  });

  it('should handle metadata with various value types', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0b1'),
      sharedId: 'entity-shared-0b1',
      language: 'eng',
      title: 'Metadata Test',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0b1'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {
        text_field: [{ value: 'hello world' }],
        number_field: [{ value: 42 }],
        labeled_field: [{ value: 'val', label: 'Label' }],
        multi_value: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      },
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({
      metadata: {
        text_field: [{ value: 'hello world' }],
        number_field: [{ value: 42 }],
        labeled_field: [{ value: 'val', label: 'Label' }],
        multi_value: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      },
    });
  });

  it('should default metadata to empty object when missing', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0c1'),
      sharedId: 'entity-shared-0c1',
      language: 'eng',
      title: 'No Metadata Entity',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0c1'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({ metadata: {} });
  });

  it('should handle published = true and published = false correctly', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0d1'),
        sharedId: 'entity-published',
        language: 'eng',
        title: 'Published Entity',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0d1'),
        published: true,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0d2'),
        sharedId: 'entity-unpublished',
        language: 'eng',
        title: 'Unpublished Entity',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0d2'),
        published: false,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
      },
    ]);

    const migrator = makeMigrator();
    const result = await migrator.migrate(EntitiesMigrationConfig);
    expect(result.migrated).toBe(2);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);

    const published = rowsForTenant.find(r => r.sharedId === 'entity-published');
    const unpublished = rowsForTenant.find(r => r.sharedId === 'entity-unpublished');

    expect(published).toMatchObject({ published: true });
    expect(unpublished).toMatchObject({ published: false });
  });

  it('should handle generatedToc true and false values', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        sharedId: 'entity-toc-true',
        language: 'eng',
        title: 'TOC True',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0e1'),
        published: true,
        generatedToc: true,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
        sharedId: 'entity-toc-false',
        language: 'eng',
        title: 'TOC False',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0e2'),
        published: true,
        generatedToc: false,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
      },
    ]);

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);

    const tocTrue = rowsForTenant.find(r => r.sharedId === 'entity-toc-true');
    const tocFalse = rowsForTenant.find(r => r.sharedId === 'entity-toc-false');

    expect(tocTrue).toMatchObject({ generatedToc: true });
    expect(tocFalse).toMatchObject({ generatedToc: false });
  });

  it('should handle preview field with value and null', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertMany([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f1'),
        sharedId: 'entity-preview-yes',
        language: 'eng',
        title: 'With Preview',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0f1'),
        published: true,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
        preview: 'https://example.com/preview',
      },
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f2'),
        sharedId: 'entity-preview-no',
        language: 'eng',
        title: 'Without Preview',
        template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0f2'),
        published: true,
        creationDate: 1700000000000,
        editDate: 1700000000000,
        metadata: {},
      },
    ]);

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);

    const withPreview = rowsForTenant.find(r => r.sharedId === 'entity-preview-yes');
    const withoutPreview = rowsForTenant.find(r => r.sharedId === 'entity-preview-no');

    expect(withPreview).toMatchObject({ preview: 'https://example.com/preview' });
    expect(withoutPreview).toMatchObject({ preview: null });
  });

  it('should skip migration when PostgreSQL entities table already has data for tenant', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);

    await testingPG.setFixtures({
      entities: [
        {
          _id: '64a1b2c3d4e5f6a7b8c9d0aa',
          sharedId: 'existing-entity',
          language: 'eng',
          title: 'Existing Entity',
          template: 'template-existing',
          published: true,
          generatedToc: null,
          icon: {},
          creationDate: 1700000000000,
          editDate: 1700000000000,
          metadata: {},
          user: null,
          permissions: [],
          preview: null,
          tenant_id: TENANT,
        },
      ],
    });

    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0ab'),
      sharedId: 'new-entity',
      language: 'eng',
      title: 'New Entity',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0ab'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    const result = await migrator.migrate(EntitiesMigrationConfig);

    expect(result.migrated).toBe(0);
    expect(result.skipped).toBe(true);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(1);
    expect(rowsForTenant[0]).toMatchObject({ sharedId: 'existing-entity' });
  });

  it('should migrate multiple entities in batch', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const entities = Array.from({ length: 150 }, (_, i) => ({
      _id: new ObjectId(),
      sharedId: `batch-entity-${i}`,
      // eslint-disable-next-line no-nested-ternary
      language: i % 3 === 0 ? 'eng' : i % 3 === 1 ? 'spa' : 'fra',
      title: `Batch Entity ${i}`,
      template: new ObjectId(),
      published: i % 2 === 0,
      creationDate: 1700000000000 + i,
      editDate: 1700000000000 + i,
      metadata: { field: [{ value: `value-${i}` }] },
      ...(i % 5 === 0 ? { user: new ObjectId() } : {}),
      ...(i % 7 === 0
        ? {
            permissions: [{ refId: `user-${i}`, type: 'user', level: 'write' }],
          }
        : {}),
      ...(i % 10 === 0 ? { preview: `https://example.com/preview/${i}` } : {}),
      ...(i % 4 === 0 ? { generatedToc: true } : {}),
      ...(i % 6 === 0 ? { icon: { _id: `icon-${i}`, label: `Icon ${i}`, type: 'icon' } } : {}),
    }));

    await mongoDb.collection('entities').insertMany(entities);

    const migrator = makeMigrator();
    const result = await migrator.migrate(EntitiesMigrationConfig);

    expect(result.migrated).toBe(150);
    expect(result.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('entities');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(150);
    expect(rowsForTenant.every(r => r.tenant_id === TENANT)).toBe(true);
  });

  it('should handle user field as null when not present', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0ac'),
      sharedId: 'entity-no-user',
      language: 'eng',
      title: 'No User Entity',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0ac'),
      published: false,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({ user: null });
  });

  it('should handle empty permissions array', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('entities').insertOne({
      _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0ad'),
      sharedId: 'entity-empty-perms',
      language: 'eng',
      title: 'Empty Permissions',
      template: new ObjectId('64a1b2c3d4e5f6a7b8c9a0ad'),
      published: true,
      creationDate: 1700000000000,
      editDate: 1700000000000,
      metadata: {},
      permissions: [],
    });

    const migrator = makeMigrator();
    await migrator.migrate(EntitiesMigrationConfig);

    const pgRows = await testingPG.getAllFrom('entities');
    const row = pgRows.filter(r => r.tenant_id === TENANT)[0];

    expect(row).toMatchObject({ permissions: [] });
  });
});
