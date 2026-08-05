/* eslint-disable max-statements */
import * as otplib from 'otplib';
import crypto, { createHash } from 'crypto';
import { z } from 'zod';

import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { User } from '../domain/user/User.js';
import { UserAccount } from '../domain/user/UserAccount.js';
import { EncryptedPassword } from '../domain/user/EncryptedPassword.js';
import {
  InvalidCredentials,
  AccountLocked,
  TwoFactorTokenRequired,
  TwoFactorTokenInvalid,
} from '../domain/user/errors.js';

const DUMMY_PASSWORD = 'Avoid user enum on login req ms diff';

// Migration-only concern (pre-bcrypt passwords) — kept out of EncryptedPassword, which
// otherwise only ever deals in bcrypt hashes. Delete once no stored password predates bcrypt.
const matchesLegacySha256Hash = (plain: string, hash: string): boolean =>
  hash === createHash('sha256').update(plain).digest('hex');

const checkDummyPassword = async (password: string): Promise<void> => {
  const dummyHash = await EncryptedPassword.create(DUMMY_PASSWORD);
  await dummyHash.compare(password);
};

const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  token: z.string().optional(),
  domain: z.string(),
});

type Input = z.infer<typeof LoginInputSchema>;
type Output = User;
type Deps = { usersDS: UsersDataSource };

class Login extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const result = await this.deps.usersDS.getByUsername(input.username);

    if (result.isError()) {
      await checkDummyPassword(input.password);
      throw new InvalidCredentials();
    }

    const user = result.getDataOrThrow();
    const wasLocked = user.credentials.isLocked();

    await this.checkPassword(user, input.password, input.domain);

    if (wasLocked) {
      throw new AccountLocked();
    }

    await this.checkTwoFactor(user, input.token, input.domain);

    user.clearLockout();
    await this.deps.usersDS.update(user);

    return this.sanitize(user);
  }

  private async checkPassword(user: UserAccount, password: string, domain: string): Promise<void> {
    const { credentials } = user;
    const validBcrypt = await credentials.password.compare(password);
    const validLegacySha256 = matchesLegacySha256Hash(password, credentials.password.getValue());

    if (validLegacySha256) {
      user.setPassword(await EncryptedPassword.create(password));
      await this.deps.usersDS.update(user);
      return;
    }

    if (!validBcrypt) {
      if (!credentials.isLocked()) {
        await this.registerFailedLogin(user, domain);
      }
      throw new InvalidCredentials();
    }
  }

  private async checkTwoFactor(user: UserAccount, token: string | undefined, domain: string) {
    const { credentials } = user;
    if (!credentials.requiresTwoFactor()) return;

    if (!token) {
      throw new TwoFactorTokenRequired();
    }

    const validToken = otplib.authenticator.verify({ token, secret: credentials.secret || '' });
    if (validToken) return;

    if (!credentials.isLocked()) {
      await this.registerFailedLogin(user, domain);
    }
    throw new TwoFactorTokenInvalid();
  }

  private async registerFailedLogin(user: UserAccount, domain: string): Promise<void> {
    user.incrementFailedLogins();

    if (!user.credentials.shouldLock()) {
      await this.deps.usersDS.update(user);
      return;
    }

    const unlockCode = crypto.randomBytes(32).toString('hex');

    user.lock(unlockCode);

    await this.deps.usersDS.update(user);
    await this.dispatcher.sendAccountLockedEmail({
      userId: user._id,
      domain,
      unlockCode: user.credentials.accountUnlockCode!,
    });
  }

  private sanitize(user: UserAccount): User {
    return new User({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      groups: user.groups,
    });
  }
}

export { Login, LoginInputSchema };
