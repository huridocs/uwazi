import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres, MigrationConfig } from '../MigrateCollectionToPostgres.js';

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
    const migrated = await migrator.migrate(config);

    expect(migrated.migrated).toBe(2);
    expect(migrated.skipped).toBe(false);

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
    const migratedA = await migratorA.migrate(config);
    expect(migratedA.migrated).toBe(1);
    expect(migratedA.skipped).toBe(false);

    const migratorB = new MigrateCollectionToPostgres(mongoDb, 'tenant-b');
    const migratedB = await migratorB.migrate(config);
    expect(migratedB.migrated).toBe(1);
    expect(migratedB.skipped).toBe(false);

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
    const migrated = await migrator.migrate(config);
    expect(migrated.migrated).toBe(0);
    expect(migrated.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    expect(pgRows.filter(r => r.tenant_id === TENANT)).toHaveLength(0);
  });

  it('should batch insert correctly', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    const docs = Array.from({ length: 2500 }, (_, i) => ({
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
    const migrated = await migrator.migrate(config);
    expect(migrated.migrated).toBe(2500);
    expect(migrated.skipped).toBe(false);

    const pgRows = await testingPG.getAllFrom('thesauri');
    const rowsForTenant = pgRows.filter(r => r.tenant_id === TENANT);
    expect(rowsForTenant).toHaveLength(2500);
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
    const migrated = await migrator.migrate(ThesaurusMigrationConfig);
    expect(migrated.migrated).toBe(1);
    expect(migrated.skipped).toBe(false);

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
});
