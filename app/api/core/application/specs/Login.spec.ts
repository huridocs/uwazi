/* eslint-disable max-statements */
import { createHash } from 'crypto';
import * as otplib from 'otplib';
import { encryptPassword } from '#api/auth/encryptPassword.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import {
  AccountLocked,
  InvalidCredentials,
  TwoFactorTokenInvalid,
  TwoFactorTokenRequired,
} from '#api/core/domain/user/errors.js';
import { UsersDAOFactory } from '#api/core/infrastructure/factories/UsersDAOFactory.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { Login } from '../Login.js';

const f = getFixturesFactory();

const TWO_FACTOR_SECRET = otplib.authenticator.generateSecret();

let bcryptPassword: string;

const buildFixtures = async () => {
  bcryptPassword = await encryptPassword('validpassword');

  return {
    users: [
      f.user({ username: 'validuser', role: UserRole.EDITOR, password: bcryptPassword }),
      {
        ...f.user({ username: 'wrongpassworduser', role: UserRole.EDITOR }),
        password: bcryptPassword,
      },
      {
        ...f.user({ username: 'legacyuser', role: UserRole.EDITOR }),
        password: createHash('sha256').update('legacypassword').digest('hex'),
      },
      {
        ...f.user({ username: 'aboutolockuser', role: UserRole.EDITOR, password: bcryptPassword }),
        failedLogins: 5,
      },
      {
        ...f.user({ username: 'lockeduser', role: UserRole.EDITOR, password: bcryptPassword }),
        accountLocked: true,
        accountUnlockCode: 'code123',
      },
      {
        ...f.user({ username: '2fauser', role: UserRole.EDITOR, password: bcryptPassword }),
        using2fa: true,
        secret: TWO_FACTOR_SECRET,
      },
      {
        ...f.user({
          username: 'clearedlockoutuser',
          role: UserRole.EDITOR,
          password: bcryptPassword,
        }),
        failedLogins: 3,
      },
    ],
  };
};

const createSut = () => {
  const usersDS = new MongoUsersDataSource({ dao: UsersDAOFactory.default() });
  const dispatcher = { sendAccountLockedEmail: jest.fn() } as unknown as Dispatcher;
  const sut = new Login({ usersDS, dispatcher }, { tenant: {} as any });
  return { sut, dispatcher };
};

const getUser = async (username: string) =>
  testingEnvironment.db.getCollection('users')!.findOne({ username });

describe('Login', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(await buildFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should return the sanitized user on a valid login', async () => {
    const { sut } = createSut();

    const user = await sut.execute({
      username: 'validuser',
      password: 'validpassword',
      domain: 'http://localhost',
    });

    expect(user.username).toBe('validuser');
    expect(user).not.toBeInstanceOf(UserAccount);
  });

  it('should clear a previous failed-login count on a valid login', async () => {
    const { sut } = createSut();

    await sut.execute({
      username: 'clearedlockoutuser',
      password: 'validpassword',
      domain: 'http://localhost',
    });

    const updated = await getUser('clearedlockoutuser');
    expect(updated!.failedLogins).toBe(0);
  });

  it('should throw InvalidCredentials and register a failed login on a wrong password', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        username: 'wrongpassworduser',
        password: 'notthepassword',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(InvalidCredentials);

    const updated = await getUser('wrongpassworduser');
    expect(updated!.failedLogins).toBe(1);
  });

  it('should throw InvalidCredentials for an unknown username without leaking user existence', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        username: 'nobody',
        password: 'whatever',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(InvalidCredentials);
  });

  it('should upgrade a legacy SHA256 password to bcrypt on successful login', async () => {
    const { sut } = createSut();

    const user = await sut.execute({
      username: 'legacyuser',
      password: 'legacypassword',
      domain: 'http://localhost',
    });

    expect(user.username).toBe('legacyuser');

    const updated = await getUser('legacyuser');
    expect(updated!.password).not.toBe(createHash('sha256').update('legacypassword').digest('hex'));
    expect(updated!.password.startsWith('$2')).toBe(true);
  });

  it('should lock the account and send the locked email once the failed-login threshold is reached', async () => {
    const { sut, dispatcher } = createSut();

    await expect(
      sut.execute({
        username: 'aboutolockuser',
        password: 'notthepassword',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(InvalidCredentials);

    const updated = await getUser('aboutolockuser');
    expect(updated!.failedLogins).toBe(6);
    expect(updated!.accountLocked).toBe(true);
    expect(dispatcher.sendAccountLockedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ domain: 'http://localhost' })
    );
  });

  it('should throw AccountLocked regardless of password correctness when already locked', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        username: 'lockeduser',
        password: 'validpassword',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(AccountLocked);
  });

  it('should throw TwoFactorTokenRequired when 2FA is enabled and no token is provided', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        username: '2fauser',
        password: 'validpassword',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(TwoFactorTokenRequired);

    const updated = await getUser('2fauser');
    expect(updated!.failedLogins ?? 0).toBe(0);
  });

  it('should throw TwoFactorTokenInvalid and register a failed login on a wrong token', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        username: '2fauser',
        password: 'validpassword',
        token: '000000',
        domain: 'http://localhost',
      })
    ).rejects.toThrow(TwoFactorTokenInvalid);

    const updated = await getUser('2fauser');
    expect(updated!.failedLogins).toBe(1);
  });

  it('should return the sanitized user when the 2FA token is correct', async () => {
    const { sut } = createSut();
    const token = otplib.authenticator.generate(TWO_FACTOR_SECRET);

    const user = await sut.execute({
      username: '2fauser',
      password: 'validpassword',
      token,
      domain: 'http://localhost',
    });

    expect(user.username).toBe('2fauser');
  });
});
