import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { PreserveSyncMigrationConfig } from '../PreserveSyncMigrationConfig.js';

const TENANT = 'preserve-sync-migration-tenant';
const LAST_IMPORT = '2020-01-01T00:00:00.000Z';

describe('PreserveSyncMigrationConfig', () => {
  it('should copy the cursor by token and drop the mongo _id', () => {
    const mapped = PreserveSyncMigrationConfig.mapDocument({
      _id: 'mongo-id',
      token: 'auth-token',
      lastImport: LAST_IMPORT,
    });

    expect(PreserveSyncMigrationConfig.mongoCollection).toBe('preservesyncs');
    expect(PreserveSyncMigrationConfig.pgTable).toBe('preserve_sync');
    expect(PreserveSyncMigrationConfig.conflictColumns).toEqual(['tenant_id', 'token']);
    expect(mapped).toEqual({
      token: 'auth-token',
      last_import: LAST_IMPORT,
    });
  });
});

describe('PreserveSyncMigrationConfig copy', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['preservesyncs']);
    await testingPG.clear(['preserve_sync']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const migrate = async () =>
    new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT).migrate(
      PreserveSyncMigrationConfig
    );

  it('should copy a cursor and preserve its import date', async () => {
    await testingDB.db(testingDB.dbName).collection('preservesyncs').insertOne({
      token: 'auth-token',
      lastImport: LAST_IMPORT,
    });

    const result = await migrate();

    expect(result).toEqual({ migrated: 1, orphansSkipped: 0, skipped: false });

    const rows = (await testingPG.getAllFrom('preserve_sync')).filter(
      row => row.tenant_id === TENANT
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      token: 'auth-token',
      last_import: LAST_IMPORT,
    });
  });

  it('should refuse a cursor that has no import date', async () => {
    await testingDB
      .db(testingDB.dbName)
      .collection('preservesyncs')
      .insertOne({ token: 'auth-token' });

    await expect(migrate()).rejects.toThrow(/lastImport/);
  });
});
