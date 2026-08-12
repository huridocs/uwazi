/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { PUBLIC_USER_ID, UserRole } from '#api/core/domain/user/User.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';

const f = getFixturesFactory();
const TENANT_ID = 'users-dao-consistency';

type UserFixture = {
  key: string;
  username: string;
  role: UserRole;
  email: string;
  secret?: string;
  failedLogins?: number;
  accountUnlockCode?: string;
  accountLocked?: boolean;
  using2fa?: boolean;
  deleted?: boolean;
};

const USER_FIXTURES: UserFixture[] = [
  { key: 'active1', username: 'active1', role: UserRole.ADMIN, email: 'active1@test.com' },
  { key: 'active2', username: 'active2', role: UserRole.EDITOR, email: 'active2@test.com' },
  {
    key: 'deleted',
    username: 'deleted',
    role: UserRole.EDITOR,
    email: 'deleted@test.com',
    deleted: true,
  },
  {
    key: 'withsensitive',
    username: 'withsensitive',
    role: UserRole.ADMIN,
    email: 'sensitive@test.com',
    secret: 'mysecret',
    failedLogins: 3,
    accountUnlockCode: 'abc123',
    accountLocked: false,
    using2fa: true,
  },
];

const mongoFixtures: DBFixture = {
  users: [
    ...USER_FIXTURES.map(u => ({
      _id: f.id(u.key),
      username: u.username,
      role: u.role,
      email: u.email,
      password: 'hash',
      ...(u.secret !== undefined && { secret: u.secret }),
      ...(u.failedLogins !== undefined && { failedLogins: u.failedLogins }),
      ...(u.accountUnlockCode !== undefined && { accountUnlockCode: u.accountUnlockCode }),
      ...(u.accountLocked !== undefined && { accountLocked: u.accountLocked }),
      ...(u.using2fa !== undefined && { using2fa: u.using2fa }),
      ...(u.deleted && { deletedAt: new Date() }),
    })),
    {
      _id: PUBLIC_USER_ID,
      username: 'public',
      role: UserRole.COLLABORATOR,
      email: 'public@uwazi.local',
    },
  ],
};

const pgFixtures = () => ({
  users: [
    ...USER_FIXTURES.map(u => ({
      _id: f.idString(u.key),
      username: u.username,
      role: u.role as string,
      email: u.email,
      password: 'hash',
      secret: u.secret ?? null,
      failedLogins: u.failedLogins ?? null,
      accountUnlockCode: u.accountUnlockCode ?? null,
      accountLocked: u.accountLocked ?? null,
      using2fa: u.using2fa ?? false,
      ...(u.deleted && { deletedAt: new Date() }),
    })),
    {
      _id: PUBLIC_USER_ID.toHexString(),
      username: 'public',
      role: UserRole.COLLABORATOR as string,
      email: 'public@uwazi.local',
      password: 'hash',
      using2fa: false,
    },
  ],
});

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UsersDAOConsistency', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresUsers: usePostgres },
      });

      if (usePostgres) {
        await testingPG.setFixtures(pgFixtures());
      } else {
        await testingEnvironment.setFixtures(mongoFixtures);
      }
    });

    const getDao = () => testingEnvironment.runWithContext(() => UsersDAOFactory.default());

    // Mongo filters/updates use ObjectId + $set/$unset; Postgres uses plain string ids and always
    // overwrites named columns. These adapters exist only where the two DAOs' native call shapes
    // diverge — everywhere else (username/email filters) the calls are identical.
    // The `as any` casts below are a deliberate escape hatch: `getDao()` is statically typed as
    // `MongoUsersDAO` (the factory's declared return type, cast from `PostgresUsersDAO` at
    // runtime — see UsersDAOFactory), but Mongo's `_id`/update typings (ObjectId, $set/$unset)
    // are genuinely incompatible with Postgres's (plain string, plain row). Everywhere else
    // (username/email filters) the calls are identical and untyped-loose on purpose.
    const idCondition = (key: string) =>
      (usePostgres
        ? { _id: f.idString(key) }
        : { _id: ObjectId.createFromHexString(f.idString(key)) }) as any;

    const setUsername = (username: string) =>
      (usePostgres ? { username } : { $set: { username } }) as any;

    const clearLockFields = () =>
      (usePostgres
        ? { accountLocked: null, accountUnlockCode: null, failedLogins: null }
        : { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }) as any;

    describe('findOne()', () => {
      it('should return the full user record by default, with no field stripping', async () => {
        const dao = getDao();
        const user = await dao.findOne({ email: 'active1@test.com' });

        expect(user?.username).toBe('active1');
        expect(user?.role).toBe('admin');
        expect(user?.password).toBeDefined();
      });

      it('should return all sensitive fields when present', async () => {
        const dao = getDao();
        const user = await dao.findOne(idCondition('withsensitive'));

        expect(user?.username).toBe('withsensitive');
        expect(user?.secret).toBe('mysecret');
        expect(user?.failedLogins).toBe(3);
        expect(user?.accountUnlockCode).toBe('abc123');
      });

      it('should return nothing for a soft-deleted user by default', async () => {
        const dao = getDao();
        const user = await dao.findOne({ email: 'deleted@test.com' });

        expect(user).toBeFalsy();
      });

      it('should return a soft-deleted user when includeDeleted is true', async () => {
        const dao = getDao();
        const user = await dao.findOne({ email: 'deleted@test.com' }, { includeDeleted: true });

        expect(user?.username).toBe('deleted');
      });

      it('should return nothing when no user matches', async () => {
        const dao = getDao();
        const user = await dao.findOne({ email: 'nobody@test.com' });

        expect(user).toBeFalsy();
      });
    });

    describe('getById()', () => {
      it('should return the user for a matching id', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('withsensitive'));

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow().username).toBe('withsensitive');
      });

      it('should fail with UserNotFound when no user matches', async () => {
        const dao = getDao();
        const result = await dao.getById(new ObjectId().toHexString());

        expect(result.isError()).toBe(true);
      });

      it('should fail by default for a soft-deleted user', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('deleted'));

        expect(result.isError()).toBe(true);
      });

      it('should return a soft-deleted user when includeDeleted is true', async () => {
        const dao = getDao();
        const result = await dao.getById(f.idString('deleted'), { includeDeleted: true });

        expect(result.isOk()).toBe(true);
        expect(result.getDataOrThrow().username).toBe('deleted');
      });
    });

    describe('exists()', () => {
      it('should return true when a matching active, non-public user exists', async () => {
        const dao = getDao();
        expect(await dao.exists({ username: 'active1' })).toBe(true);
      });

      it('should return false for a soft-deleted user', async () => {
        const dao = getDao();
        expect(await dao.exists({ username: 'deleted' })).toBe(false);
      });

      it('should return false for the system/public user', async () => {
        const dao = getDao();
        expect(await dao.exists({ username: 'public' })).toBe(false);
      });

      it('should return false when no user matches', async () => {
        const dao = getDao();
        expect(await dao.exists({ username: 'nonexistent' })).toBe(false);
      });
    });

    describe('count()', () => {
      it('should count non-deleted, non-public users when notPublicUserFilter is merged in', async () => {
        const dao = getDao();
        const count = await dao.count(dao.notPublicUserFilter());

        expect(count).toBe(3);
      });

      it('should exclude soft-deleted users even without excludePublicUser', async () => {
        const dao = getDao();
        const count = await dao.count();

        expect(count).toBe(4);
      });
    });

    describe('updateOne()', () => {
      it('should update the given fields for an active user', async () => {
        const dao = getDao();
        await dao.updateOne(idCondition('active1'), setUsername('renamed'));

        const updated = await dao.findOne(idCondition('active1'));
        expect(updated?.username).toBe('renamed');
      });

      it('should clear lock fields', async () => {
        const dao = getDao();
        await dao.updateOne(idCondition('withsensitive'), clearLockFields());

        const updated = await dao.findOne(idCondition('withsensitive'));
        expect(updated?.accountLocked).toBeFalsy();
        expect(updated?.accountUnlockCode).toBeFalsy();
        expect(updated?.failedLogins).toBeFalsy();
      });

      it('should not update a soft-deleted user by default', async () => {
        const dao = getDao();
        await dao.updateOne(idCondition('deleted'), setUsername('renamed'));

        const updated = await dao.findOne(idCondition('deleted'), { includeDeleted: true });
        expect(updated?.username).toBe('deleted');
      });

      it('should update a soft-deleted user when includeDeleted is true', async () => {
        const dao = getDao();
        await dao.updateOne(idCondition('deleted'), setUsername('renamed'), {
          includeDeleted: true,
        });

        const updated = await dao.findOne(idCondition('deleted'), { includeDeleted: true });
        expect(updated?.username).toBe('renamed');
      });
    });

    describe('insertOne()', () => {
      it('should insert a new user record', async () => {
        const dao = getDao();
        const newId = usePostgres ? 'brand-new-id' : new ObjectId();

        await dao.insertOne({
          _id: newId as any,
          username: 'brandnew',
          role: UserRole.EDITOR,
          email: 'brandnew@test.com',
          password: 'hash',
          using2fa: false,
        } as any);

        const user = await dao.findOne({ email: 'brandnew@test.com' });
        expect(user?.username).toBe('brandnew');
      });
    });

    describe('findByIds()', () => {
      it('should return the matching, non-deleted, non-public users', async () => {
        const dao = getDao();
        const users = await dao.findByIds([f.idString('active1'), f.idString('active2')]);

        expect(users.map(u => u.username).sort()).toEqual(['active1', 'active2']);
      });

      it('should exclude soft-deleted users by default', async () => {
        const dao = getDao();
        const users = await dao.findByIds([f.idString('deleted')]);

        expect(users).toEqual([]);
      });

      it('should include soft-deleted users when includeDeleted is true', async () => {
        const dao = getDao();
        const users = await dao.findByIds([f.idString('deleted')], { includeDeleted: true });

        expect(users.map(u => u.username)).toEqual(['deleted']);
      });

      it('should exclude the public/system user even when explicitly requested', async () => {
        const dao = getDao();
        const users = await dao.findByIds([f.idString('active1'), PUBLIC_USER_ID.toHexString()]);

        expect(users.map(u => u.username)).toEqual(['active1']);
      });

      it('should return an empty array for an empty id list', async () => {
        const dao = getDao();
        expect(await dao.findByIds([])).toEqual([]);
      });

      it('should return an empty array when no id matches', async () => {
        const dao = getDao();
        expect(await dao.findByIds([new ObjectId().toHexString()])).toEqual([]);
      });
    });

    describe('findByEmailOrUsername()', () => {
      it('should match by exact username, case-insensitively', async () => {
        const dao = getDao();
        const users = await dao.findByEmailOrUsername('ACTIVE1');

        expect(users.map(u => u.username)).toEqual(['active1']);
      });

      it('should match by exact email, case-insensitively', async () => {
        const dao = getDao();
        const users = await dao.findByEmailOrUsername('ACTIVE2@TEST.COM');

        expect(users.map(u => u.username)).toEqual(['active2']);
      });

      it('should not match a partial/prefix term', async () => {
        const dao = getDao();
        const users = await dao.findByEmailOrUsername('active');

        expect(users).toEqual([]);
      });

      it('should exclude soft-deleted users', async () => {
        const dao = getDao();
        const users = await dao.findByEmailOrUsername('deleted');

        expect(users).toEqual([]);
      });

      it('should exclude the public/system user', async () => {
        const dao = getDao();
        const users = await dao.findByEmailOrUsername('public');

        expect(users).toEqual([]);
      });

      it('should return an empty array when nothing matches', async () => {
        const dao = getDao();
        expect(await dao.findByEmailOrUsername('nonexistent')).toEqual([]);
      });
    });

    describe('softDelete()', () => {
      it('should set deletedAt on the given ids and return the affected count', async () => {
        const dao = getDao();
        const modifiedCount = await dao.softDelete([f.idString('active1')]);

        expect(modifiedCount).toBe(1);
        const updated = await dao.findOne(idCondition('active1'), { includeDeleted: true });
        expect(updated?.deletedAt).toBeTruthy();
      });

      it('should still report a soft-deleted id as affected (re-stamps deletedAt)', async () => {
        const dao = getDao();
        const modifiedCount = await dao.softDelete([f.idString('deleted')]);

        expect(modifiedCount).toBe(1);
      });

      it('should return 0 for an empty list', async () => {
        const dao = getDao();
        expect(await dao.softDelete([])).toBe(0);
      });
    });
  });
});
