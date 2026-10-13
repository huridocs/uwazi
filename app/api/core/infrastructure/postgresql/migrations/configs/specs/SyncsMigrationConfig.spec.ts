import { testingDB } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { SyncsMigrationConfig } from '../SyncsMigrationConfig.js';

describe('SyncsMigrationConfig', () => {
  it('should copy the cursor by config name and drop the mongo _id', () => {
    const mapped = SyncsMigrationConfig.mapDocument({
      _id: 'mongo-id',
      name: 'target-a',
      lastSyncs: { files: 10, entities: 20 },
      consecutiveFailures: 3,
    });

    expect(SyncsMigrationConfig.mongoCollection).toBe('syncs');
    expect(SyncsMigrationConfig.pgTable).toBe('syncs');
    expect(SyncsMigrationConfig.conflictColumns).toEqual(['tenant_id', 'name']);
    expect(mapped).toEqual({
      name: 'target-a',
      last_syncs: { files: 10, entities: 20 },
      consecutive_failures: 3,
    });
  });
});

describe('SyncsMigrationConfig copy', () => {
  const TENANT = 'syncs-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['syncs']);
    await testingPG.clear(['syncs']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy a cursor and preserve its timestamps', async () => {
    await testingDB
      .db(testingDB.dbName)
      .collection('syncs')
      .insertOne({
        name: 'target-a',
        lastSyncs: { entities: 50 },
        consecutiveFailures: 2,
      });

    const result = await new MigrateCollectionToPostgres(
      testingDB.db(testingDB.dbName),
      TENANT
    ).migrate(SyncsMigrationConfig);

    expect(result).toEqual({ migrated: 1, orphansSkipped: 0, skipped: false });

    const rows = (await testingPG.getAllFrom('syncs')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'target-a',
      last_syncs: { entities: 50 },
      consecutive_failures: 2,
    });
  });
});
