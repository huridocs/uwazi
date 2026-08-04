import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { UsersMigrationConfig } from '../UsersMigrationConfig.js';

describe('UsersMigrationConfig', () => {
  const TENANT = 'users-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['users']);
    await testingPG.clear(['users']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  type UserPgRow = {
    _id: string;
    username: string;
    password: string;
    email: string;
    role: string;
    using2fa: boolean;
    secret: string | null;
  };

  const makeMigrator = () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    return new MigrateCollectionToPostgres(mongoDb, TENANT);
  };

  it('should migrate a user record with all fields converted', async () => {
    await testingDB
      .db(testingDB.dbName)
      .collection('users')
      .insertOne({
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        username: 'migrateduser',
        password: 'hashed-password',
        email: 'migrated@test.com',
        role: 'editor',
        using2fa: true,
        secret: 'a-secret',
      });

    const result = await makeMigrator().migrate(UsersMigrationConfig);
    expect(result).toEqual({ migrated: 1, skipped: false });

    const rows = await testingPG.getAllFrom<UserPgRow>('users');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      username: 'migrateduser',
      password: 'hashed-password',
      email: 'migrated@test.com',
      role: 'editor',
      using2fa: true,
      secret: 'a-secret',
    });
  });

  it('should default using2fa to false when missing on the Mongo document', async () => {
    await testingDB.db(testingDB.dbName).collection('users').insertOne({
      _id: new ObjectId(),
      username: 'nou2fauser',
      password: 'hashed-password',
      email: 'nou2fa@test.com',
      role: 'collaborator',
    });

    await makeMigrator().migrate(UsersMigrationConfig);

    const rows = await testingPG.getAllFrom<UserPgRow>('users');
    expect(rows[0].using2fa).toBe(false);
  });

  it('should skip migration when the postgres table already has rows for the tenant', async () => {
    const mongoDb = testingDB.db(testingDB.dbName);
    await mongoDb.collection('users').insertOne({
      _id: new ObjectId(),
      username: 'someuser',
      password: 'hash',
      email: 'some@test.com',
      role: 'editor',
    });

    await testingPG.setFixtures({
      users: [
        {
          _id: 'existing-id',
          tenant_id: TENANT,
          username: 'existinguser',
          password: 'hash',
          email: 'existing@test.com',
          role: 'admin',
          using2fa: false,
        },
      ],
    });

    const result = await makeMigrator().migrate(UsersMigrationConfig);

    expect(result).toEqual({ migrated: 0, skipped: true });
  });
});
