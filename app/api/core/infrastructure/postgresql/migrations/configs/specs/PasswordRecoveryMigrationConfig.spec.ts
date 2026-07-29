import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { PasswordRecoveryMigrationConfig } from '../PasswordRecoveryMigrationConfig.js';

describe('PasswordRecoveryMigrationConfig', () => {
  const TENANT = 'password-recovery-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['passwordrecoveries']);
    await testingPG.clear(['password_recoveries']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  type PasswordRecoveryPgRow = { _id: string; key: string; userId: string; expiresAt: string };

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should migrate a password recovery record with all fields converted', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await testingDB
      .db(testingDB.dbName)
      .collection('passwordrecoveries')
      .insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        key: 'migrated-key-123',
        user: new ObjectId('64a1b2c3d4e5f6a7b8c9b001'),
        expiresAt,
      });

    const result = await makeMigrator().migrate(PasswordRecoveryMigrationConfig);
    expect(result).toEqual({ migrated: 1, skipped: false });

    const rows = await testingPG.getAllFrom<PasswordRecoveryPgRow>('password_recoveries');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      key: 'migrated-key-123',
      userId: '64a1b2c3d4e5f6a7b8c9b001',
    });
    expect(new Date(rows[0].expiresAt).getTime()).toBe(expiresAt.getTime());
  });

  it('should skip migration when the postgres table already has rows for the tenant', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('passwordrecoveries').insertOne({
      _id: new ObjectId(),
      key: 'some-key',
      user: new ObjectId(),
      expiresAt: new Date(),
    });

    await testingPG.setFixtures({
      password_recoveries: [
        {
          _id: 'existing-id',
          tenant_id: TENANT,
          key: 'existing-key',
          userId: 'existing-user',
          expiresAt: new Date().toISOString(),
        },
      ],
    });

    const migrator = makeMigrator();
    const result = await migrator.migrate(PasswordRecoveryMigrationConfig);

    expect(result).toEqual({ migrated: 0, skipped: true });
  });
});
