import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { UpdateLogsMigrationConfig } from '../UpdateLogsMigrationConfig.js';

describe('UpdateLogsMigrationConfig', () => {
  it('should keep the mongo document id as the conflict key and drop the mongo _id', () => {
    const mongoId = new ObjectId();
    const mapped = UpdateLogsMigrationConfig.mapDocument({
      _id: new ObjectId(),
      mongoId,
      namespace: 'entities',
      timestamp: 100,
      deleted: false,
    });

    expect(UpdateLogsMigrationConfig.mongoCollection).toBe('updatelogs');
    expect(UpdateLogsMigrationConfig.pgTable).toBe('updatelogs');
    expect(UpdateLogsMigrationConfig.conflictColumns).toEqual(['tenant_id', 'id']);
    expect(mapped).toEqual({
      id: mongoId.toHexString(),
      namespace: 'entities',
      timestamp: 100,
      deleted: false,
    });
  });
});

describe('UpdateLogsMigrationConfig copy', () => {
  const TENANT = 'updatelogs-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['updatelogs']);
    await testingPG.clear(['updatelogs']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy a log and preserve its timestamp', async () => {
    const mongoId = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('updatelogs').insertOne({
      mongoId,
      namespace: 'files',
      timestamp: 100,
      deleted: true,
    });

    const result = await new MigrateCollectionToPostgres(
      testingDB.db(testingDB.dbName),
      TENANT
    ).migrate(UpdateLogsMigrationConfig);

    expect(result).toEqual({ migrated: 1, orphansSkipped: 0, skipped: false });

    const rows = (await testingPG.getAllFrom('updatelogs')).filter(row => row.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: mongoId.toHexString(),
      namespace: 'files',
      timestamp: 100,
      deleted: true,
    });
  });
});
