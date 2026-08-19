import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { UserGroupsMigrationConfig } from '../UserGroupsMigrationConfig.js';

describe('UserGroupsMigrationConfig', () => {
  const TENANT = 'usergroups-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['usergroups']);
    await testingPG.clear(['usergroups']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  type UserGroupPgRow = {
    _id: string;
    name: string;
    members: string[];
  };

  const makeMigrator = () =>
    new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT);

  const insertGroups = async (docs: Record<string, unknown>[]) =>
    testingDB.db(testingDB.dbName).collection('usergroups').insertMany(docs);

  it('should flatten Mongo `{ refId }` members into a plain array of id strings', async () => {
    await insertGroups([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
        name: 'Group A',
        members: [{ refId: '64a1b2c3d4e5f6a7b8c9d0f1' }, { refId: '64a1b2c3d4e5f6a7b8c9d0f2' }],
      },
    ]);

    const result = await makeMigrator().migrate(UserGroupsMigrationConfig);
    expect(result).toEqual({ migrated: 1, skipped: false });

    const rows = await testingPG.getAllFrom<UserGroupPgRow>('usergroups');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: '64a1b2c3d4e5f6a7b8c9d0e1',
      name: 'Group A',
      members: ['64a1b2c3d4e5f6a7b8c9d0f1', '64a1b2c3d4e5f6a7b8c9d0f2'],
    });
  });

  it('should stringify ObjectId refIds', async () => {
    await insertGroups([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
        name: 'Group B',
        members: [{ refId: new ObjectId('64a1b2c3d4e5f6a7b8c9d0f3') }],
      },
    ]);

    await makeMigrator().migrate(UserGroupsMigrationConfig);

    const rows = await testingPG.getAllFrom<UserGroupPgRow>('usergroups');
    expect(rows[0].members).toEqual(['64a1b2c3d4e5f6a7b8c9d0f3']);
  });

  it('should migrate a group with no members as an empty array, never null', async () => {
    await insertGroups([
      { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e3'), name: 'Empty', members: [] },
      { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e4'), name: 'Missing' },
    ]);

    await makeMigrator().migrate(UserGroupsMigrationConfig);

    const rows = await testingPG.getAllFrom<UserGroupPgRow>('usergroups');
    rows.forEach(row => expect(row.members).toEqual([]));
  });

  it('should drop malformed members rather than writing nulls into the array', async () => {
    await insertGroups([
      {
        _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e5'),
        name: 'Mixed',
        members: [{ refId: '64a1b2c3d4e5f6a7b8c9d0f4' }, {}, { refId: '' }, null],
      },
    ]);

    await makeMigrator().migrate(UserGroupsMigrationConfig);

    const rows = await testingPG.getAllFrom<UserGroupPgRow>('usergroups');
    expect(rows[0].members).toEqual(['64a1b2c3d4e5f6a7b8c9d0f4']);
  });

  it('should skip when the Postgres table already has data for the tenant', async () => {
    await insertGroups([
      { _id: new ObjectId('64a1b2c3d4e5f6a7b8c9d0e6'), name: 'First', members: [] },
    ]);
    await makeMigrator().migrate(UserGroupsMigrationConfig);

    const result = await makeMigrator().migrate(UserGroupsMigrationConfig);

    expect(result).toEqual({ migrated: 0, skipped: true });
    expect(await testingPG.getAllFrom<UserGroupPgRow>('usergroups')).toHaveLength(1);
  });
});
