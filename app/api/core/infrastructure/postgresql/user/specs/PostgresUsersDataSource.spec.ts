/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresUsersDataSource } from '../PostgresUsersDataSource.js';

const TENANT_ID = 'test-tenant';
const OTHER_TENANT_ID = 'other-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresUsersDataSource({
    tenantId,
    pgTransactionManager: managerFor(tenantId),
  });

const insertUser = async (tenantId: string, overrides: Record<string, unknown> = {}) => {
  await testingPG.setFixtures({
    users: [
      {
        _id: 'user-1',
        tenant_id: tenantId,
        username: 'existinguser',
        password: 'hash',
        email: 'existing@test.com',
        role: 'editor',
        using2fa: false,
        ...overrides,
      },
    ],
  });
};

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['users']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresUsersDataSource', () => {
  describe('getTwoFactorStatus', () => {
    it('should return the username and using2fa status', async () => {
      await insertUser(TENANT_ID, { using2fa: true });

      const result = await makeDS().getTwoFactorStatus('user-1');

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toEqual({ username: 'existinguser', using2fa: true });
    });

    it('should return fail with UserNotFound when the user does not exist', async () => {
      const result = await makeDS().getTwoFactorStatus('missing-user');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UserNotFound');
    });

    it('should not find a user created under a different tenant', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS(OTHER_TENANT_ID).getTwoFactorStatus('user-1');

      expect(result.isError()).toBe(true);
    });
  });

  describe('setTwoFactorSecret', () => {
    it('should persist the secret for the user', async () => {
      await insertUser(TENANT_ID);

      await makeDS().setTwoFactorSecret('user-1', 'a-new-secret');

      const result = await makeDS().getTwoFactorSecret('user-1');
      expect(result.getData()).toBe('a-new-secret');
    });
  });

  describe('getTwoFactorSecret', () => {
    it('should return null when no secret has been set', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().getTwoFactorSecret('user-1');

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toBe(null);
    });

    it('should return the stored secret', async () => {
      await insertUser(TENANT_ID, { secret: 'stored-secret' });

      const result = await makeDS().getTwoFactorSecret('user-1');

      expect(result.getData()).toBe('stored-secret');
    });

    it('should return fail with UserNotFound when the user does not exist', async () => {
      const result = await makeDS().getTwoFactorSecret('missing-user');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UserNotFound');
    });
  });

  describe('enableTwoFactor', () => {
    it('should set using2fa to true', async () => {
      await insertUser(TENANT_ID, { using2fa: false });

      await makeDS().enableTwoFactor('user-1');

      const result = await makeDS().getTwoFactorStatus('user-1');
      expect(result.getData()!.using2fa).toBe(true);
    });
  });

  describe('disableTwoFactor', () => {
    it('should set using2fa to false and clear the secret', async () => {
      await insertUser(TENANT_ID, { using2fa: true, secret: 'old-secret' });

      await makeDS().disableTwoFactor('user-1');

      const status = await makeDS().getTwoFactorStatus('user-1');
      expect(status.getData()!.using2fa).toBe(false);

      const secret = await makeDS().getTwoFactorSecret('user-1');
      expect(secret.getData()).toBe(null);
    });
  });

  describe('getByUsername', () => {
    it('should return the user hydrated with credentials', async () => {
      await insertUser(TENANT_ID, {
        failedLogins: 2,
        accountLocked: true,
        accountUnlockCode: 'unlock-code',
        using2fa: true,
        secret: 'a-secret',
      });

      const result = await makeDS().getByUsername('existinguser');

      expect(result.isOk()).toBe(true);
      const user = result.getData()!;
      expect(user.username).toBe('existinguser');
      expect(user.credentials?.password.getValue()).toBe('hash');
      expect(user.credentials?.failedLogins).toBe(2);
      expect(user.credentials?.accountLocked).toBe(true);
      expect(user.credentials?.accountUnlockCode).toBe('unlock-code');
      expect(user.credentials?.using2fa).toBe(true);
      expect(user.credentials?.secret).toBe('a-secret');
    });

    it('should return fail with UserNotFound when the username does not exist', async () => {
      const result = await makeDS().getByUsername('missing-username');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UserNotFound');
    });

    it('should return fail with UserNotFound when the user is soft-deleted', async () => {
      await insertUser(TENANT_ID, { deletedAt: new Date() });

      const result = await makeDS().getByUsername('existinguser');

      expect(result.isError()).toBe(true);
    });

    it('should not find a user created under a different tenant', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS(OTHER_TENANT_ID).getByUsername('existinguser');

      expect(result.isError()).toBe(true);
    });
  });

  describe('update() with credentials', () => {
    it('should persist password, lockout and 2fa fields from the Credentials VO', async () => {
      await insertUser(TENANT_ID);

      const credentials = new Credentials({
        password: EncryptedPassword.fromHash('new-hash'),
        failedLogins: 3,
        accountLocked: true,
        accountUnlockCode: 'new-unlock-code',
        using2fa: true,
        secret: 'new-secret',
      });
      const user = new UserAccount({
        _id: 'user-1',
        username: 'existinguser',
        role: UserRole.EDITOR,
        email: 'existing@test.com',
        credentials,
      });

      await makeDS().update(user);

      const result = await makeDS().getByUsername('existinguser');
      const updated = result.getData()!;
      expect(updated.credentials?.password.getValue()).toBe('new-hash');
      expect(updated.credentials?.failedLogins).toBe(3);
      expect(updated.credentials?.accountLocked).toBe(true);
      expect(updated.credentials?.accountUnlockCode).toBe('new-unlock-code');
      expect(updated.credentials?.using2fa).toBe(true);
      expect(updated.credentials?.secret).toBe('new-secret');
    });

    it('should clear accountUnlockCode when the Credentials VO has none', async () => {
      await insertUser(TENANT_ID, { accountUnlockCode: 'old-code' });

      const credentials = new Credentials({ password: EncryptedPassword.fromHash('new-hash') });
      const user = new UserAccount({
        _id: 'user-1',
        username: 'existinguser',
        role: UserRole.EDITOR,
        email: 'existing@test.com',
        credentials,
      });

      await makeDS().update(user);

      const result = await makeDS().getByUsername('existinguser');
      expect(result.getData()!.credentials?.accountUnlockCode).toBeUndefined();
    });
  });

  describe('insert', () => {
    it('should insert a new user account', async () => {
      const user = new UserAccount({
        _id: 'user-2',
        username: 'newuser',
        role: UserRole.EDITOR,
        email: 'new@test.com',
        credentials: new Credentials({ password: EncryptedPassword.fromHash('new-hash') }),
      });

      await makeDS().insert(user);

      const result = await makeDS().getByUsername('newuser');
      expect(result.getData()!.credentials?.password.getValue()).toBe('new-hash');
    });
  });

  describe('delete', () => {
    it('should soft-delete the given user ids and return the affected count', async () => {
      await insertUser(TENANT_ID);

      const count = await makeDS().delete(['user-1']);

      expect(count).toBe(1);
      const result = await makeDS().getByUsername('existinguser');
      expect(result.isError()).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return the user for a matching id', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().getById('user-1');

      expect(result.isOk()).toBe(true);
      expect(result.getData()!.username).toBe('existinguser');
    });

    it('should return fail with UserNotFound when no user matches', async () => {
      const result = await makeDS().getById('missing-user');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UserNotFound');
    });
  });

  describe('getByEmail', () => {
    it('should return the user for a matching email', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().getByEmail('existing@test.com');

      expect(result.isOk()).toBe(true);
      expect(result.getData()!.username).toBe('existinguser');
    });

    it('should return fail with UserNotFound when no user matches', async () => {
      const result = await makeDS().getByEmail('missing@test.com');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UserNotFound');
    });
  });

  describe('getAccountById', () => {
    it('should return the user hydrated with credentials', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().getAccountById('user-1');

      expect(result.isOk()).toBe(true);
      expect(result.getData()!.credentials?.password.getValue()).toBe('hash');
    });

    it('should return fail with UserNotFound when no user matches', async () => {
      const result = await makeDS().getAccountById('missing-user');

      expect(result.isError()).toBe(true);
    });
  });

  describe('countActiveUsers', () => {
    it('should count non-deleted, non-public users', async () => {
      await testingPG.setFixtures({
        users: [
          {
            _id: 'u1',
            tenant_id: TENANT_ID,
            username: 'u1',
            password: 'h',
            email: 'u1@t.com',
            role: 'editor',
            using2fa: false,
          },
          {
            _id: 'u2',
            tenant_id: TENANT_ID,
            username: 'u2',
            password: 'h',
            email: 'u2@t.com',
            role: 'editor',
            using2fa: false,
          },
          {
            _id: 'u3',
            tenant_id: TENANT_ID,
            username: 'u3',
            password: 'h',
            email: 'u3@t.com',
            role: 'editor',
            using2fa: false,
            deletedAt: new Date(),
          },
        ],
      });

      const count = await makeDS().countActiveUsers();

      expect(count).toBe(2);
    });
  });

  describe('checkUniqueUsername', () => {
    it('should fail with UsernameExists when the username is taken', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().checkUniqueUsername(
        new UserAccount({
          _id: 'other',
          username: 'existinguser',
          role: UserRole.EDITOR,
          email: 'other@test.com',
          credentials: new Credentials({ password: EncryptedPassword.fromHash('h') }),
        })
      );

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('UsernameExists');
    });

    it('should succeed when the username is free', async () => {
      const result = await makeDS().checkUniqueUsername(
        new UserAccount({
          _id: 'other',
          username: 'freeusername',
          role: UserRole.EDITOR,
          email: 'other@test.com',
          credentials: new Credentials({ password: EncryptedPassword.fromHash('h') }),
        })
      );

      expect(result.isOk()).toBe(true);
    });
  });

  describe('checkUniqueEmail', () => {
    it('should fail with EmailInUse when the email is taken', async () => {
      await insertUser(TENANT_ID);

      const result = await makeDS().checkUniqueEmail(
        new UserAccount({
          _id: 'other',
          username: 'other',
          role: UserRole.EDITOR,
          email: 'existing@test.com',
          credentials: new Credentials({ password: EncryptedPassword.fromHash('h') }),
        })
      );

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('EmailInUse');
    });
  });

  describe('findByUsernameAndUnlockCode', () => {
    it('should return the user when the unlock code matches', async () => {
      await insertUser(TENANT_ID, { accountUnlockCode: 'the-code' });

      const result = await makeDS().findByUsernameAndUnlockCode('existinguser', 'the-code');

      expect(result.isOk()).toBe(true);
      expect(result.getData()!.username).toBe('existinguser');
    });

    it('should fail with InvalidUnlockCode when the code does not match', async () => {
      await insertUser(TENANT_ID, { accountUnlockCode: 'the-code' });

      const result = await makeDS().findByUsernameAndUnlockCode('existinguser', 'wrong-code');

      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('InvalidUnlockCode');
    });
  });

  describe('clearLockFields', () => {
    it('should clear accountLocked, accountUnlockCode and failedLogins', async () => {
      await insertUser(TENANT_ID, {
        accountLocked: true,
        accountUnlockCode: 'a-code',
        failedLogins: 4,
      });

      await makeDS().clearLockFields('user-1');

      const result = await makeDS().getAccountById('user-1');
      expect(result.getData()!.credentials?.accountLocked).toBe(false);
      expect(result.getData()!.credentials?.accountUnlockCode).toBeUndefined();
      expect(result.getData()!.credentials?.failedLogins).toBe(0);
    });
  });

  describe('updatePassword', () => {
    it('should persist the new password hash', async () => {
      await insertUser(TENANT_ID);

      await makeDS().updatePassword('user-1', EncryptedPassword.fromHash('rotated-hash'));

      const result = await makeDS().getAccountById('user-1');
      expect(result.getData()!.credentials?.password.getValue()).toBe('rotated-hash');
    });
  });

  describe('soft-delete guard', () => {
    it('should not read a soft-deleted user via getTwoFactorStatus/getTwoFactorSecret/getById/getAccountById', async () => {
      await insertUser(TENANT_ID, { deletedAt: new Date() });

      expect((await makeDS().getTwoFactorStatus('user-1')).isError()).toBe(true);
      expect((await makeDS().getTwoFactorSecret('user-1')).isError()).toBe(true);
      expect((await makeDS().getById('user-1')).isError()).toBe(true);
      expect((await makeDS().getAccountById('user-1')).isError()).toBe(true);
    });

    it('should not mutate a soft-deleted user via setTwoFactorSecret/enableTwoFactor/updatePassword', async () => {
      await insertUser(TENANT_ID, { deletedAt: new Date(), using2fa: false });

      await makeDS().setTwoFactorSecret('user-1', 'ignored');
      await makeDS().enableTwoFactor('user-1');
      await makeDS().updatePassword('user-1', EncryptedPassword.fromHash('ignored'));

      const [row] = await testingPG.getAllFrom('users');
      expect(row.secret).toBeFalsy();
      expect(row.using2fa).toBe(false);
      expect(row.password).toBe('hash');
    });
  });
});
