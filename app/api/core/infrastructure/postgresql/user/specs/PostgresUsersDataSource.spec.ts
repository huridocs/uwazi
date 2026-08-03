import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Credentials } from '#api/core/domain/user/Credentials.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
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

  describe('updateCredentials', () => {
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

      await makeDS().updateCredentials('user-1', credentials);

      const result = await makeDS().getByUsername('existinguser');
      const user = result.getData()!;
      expect(user.credentials?.password.getValue()).toBe('new-hash');
      expect(user.credentials?.failedLogins).toBe(3);
      expect(user.credentials?.accountLocked).toBe(true);
      expect(user.credentials?.accountUnlockCode).toBe('new-unlock-code');
      expect(user.credentials?.using2fa).toBe(true);
      expect(user.credentials?.secret).toBe('new-secret');
    });

    it('should clear accountUnlockCode when the Credentials VO has none', async () => {
      await insertUser(TENANT_ID, { accountUnlockCode: 'old-code' });

      const credentials = new Credentials({ password: EncryptedPassword.fromHash('new-hash') });

      await makeDS().updateCredentials('user-1', credentials);

      const result = await makeDS().getByUsername('existinguser');
      expect(result.getData()!.credentials?.accountUnlockCode).toBeUndefined();
    });
  });

  describe('methods not yet implemented', () => {
    const dummyUser = { _id: 'x' } as Parameters<PostgresUsersDataSource['insert']>[0];

    const notImplementedCases: [string, () => Promise<unknown>][] = [
      ['insert', async () => makeDS().insert(dummyUser)],
      ['delete', async () => makeDS().delete(['x'])],
      ['update', async () => makeDS().update(dummyUser)],
      ['getById', async () => makeDS().getById('x')],
      ['getByEmail', async () => makeDS().getByEmail('x@test.com')],
      ['countActiveUsers', async () => makeDS().countActiveUsers()],
      ['checkUniqueUsername', async () => makeDS().checkUniqueUsername(dummyUser)],
      ['checkUniqueEmail', async () => makeDS().checkUniqueEmail(dummyUser)],
      ['findByUsernameAndUnlockCode', async () => makeDS().findByUsernameAndUnlockCode('x', 'y')],
      ['clearLockFields', async () => makeDS().clearLockFields('x')],
      ['updatePassword', async () => makeDS().updatePassword('x', {} as never)],
    ];

    it.each(notImplementedCases)(
      '%s should throw "Method not implemented."',
      async (_name, run) => {
        await expect(run()).rejects.toThrow('Method not implemented.');
      }
    );
  });
});
