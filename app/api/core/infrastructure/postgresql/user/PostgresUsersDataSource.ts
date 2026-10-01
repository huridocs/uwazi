import {
  TwoFactorStatus,
  UsersDataSource,
} from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import {
  EmailInUse,
  UsernameExists,
  UserNotFound,
  InvalidUnlockCode,
} from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import type { PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUsersMapper } from './PostgresUsersMapper.js';
import type { UserFieldGroup } from './UserReadOptions.js';

/** Everything UserAccount's Credentials need: password, secret, lockout state and using2fa. */
const ACCOUNT_FIELDS: UserFieldGroup[] = ['identity', 'status', 'credentials', 'security'];

const UNIQUE_VIOLATION = '23505';

/**
 * The unique indexes are the last word on a taken username or email: two writes can both pass
 * the checks before either lands. Their rejection is reported as the same conflict the checks
 * raise.
 */
const asConflict = (error: unknown, user: User): unknown => {
  const { code, constraint } = (error ?? {}) as { code?: string; constraint?: string };
  if (code !== UNIQUE_VIOLATION) return error;
  if (constraint === 'users_username') return new UsernameExists(user.username);
  if (constraint === 'users_email') return new EmailInUse(user.email);
  return error;
};

class PostgresUsersDataSource implements UsersDataSource {
  private dao: PostgresUsersDAO;

  constructor(deps: PostgresDataSourceDeps) {
    this.dao = new PostgresUsersDAO(deps);
  }

  async checkUniqueUsername(user: User): Promise<ResultType<boolean, UsernameExists>> {
    const exists = await this.dao.exists({ username: user.username });

    if (exists) {
      return Result.fail(new UsernameExists(user.username));
    }

    return Result.ok(true);
  }

  async checkUniqueEmail(user: User): Promise<ResultType<boolean, EmailInUse>> {
    const exists = await this.dao.exists({ email: user.email });

    if (exists) {
      return Result.fail(new EmailInUse(user.email));
    }

    return Result.ok(true);
  }

  async getById(id: string): Promise<ResultType<User, UserNotFound>> {
    const row = await this.dao.findOne({ _id: id }, { fields: ['identity', 'status'] });

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(PostgresUsersMapper.toDomain(row));
  }

  async getByEmail(email: string): Promise<ResultType<User, UserNotFound>> {
    const row = await this.dao.findOne({ email });

    if (!row) {
      return Result.fail(new UserNotFound(email));
    }

    return Result.ok(PostgresUsersMapper.toDomain(row));
  }

  async getByUsername(username: string): Promise<ResultType<UserAccount, UserNotFound>> {
    const row = await this.dao.findOne({ username }, { fields: ACCOUNT_FIELDS });

    if (!row) {
      return Result.fail(new UserNotFound(username));
    }

    return Result.ok(PostgresUsersMapper.toAccountDomain(row));
  }

  async getAccountById(id: string): Promise<ResultType<UserAccount, UserNotFound>> {
    const row = await this.dao.findOne({ _id: id }, { fields: ACCOUNT_FIELDS });

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(PostgresUsersMapper.toAccountDomain(row));
  }

  async countActiveUsers(): Promise<number> {
    return this.dao.count();
  }

  async getActiveAdminIds(): Promise<string[]> {
    const admins = await this.dao.findMany({ role: 'admin' });
    return admins.map(admin => admin._id);
  }

  async insert(user: UserAccount): Promise<void> {
    try {
      await this.dao.insertOne(PostgresUsersMapper.toRow(user));
    } catch (error) {
      throw asConflict(error, user);
    }
  }

  async update(user: User): Promise<void> {
    try {
      await this.dao.updateOne({ _id: user._id }, PostgresUsersMapper.toRow(user));
    } catch (error) {
      throw asConflict(error, user);
    }
  }

  async delete(userIds: string[]): Promise<number> {
    return this.dao.delete(userIds);
  }

  async findByUsernameAndUnlockCode(
    username: string,
    code: string
  ): Promise<ResultType<User, InvalidUnlockCode>> {
    const row = await this.dao.findOne(
      { username, accountUnlockCode: code },
      { fields: ['identity'] }
    );

    if (!row) {
      return Result.fail(new InvalidUnlockCode());
    }

    return Result.ok(PostgresUsersMapper.toDomain(row));
  }

  async clearLockFields(userId: string): Promise<void> {
    await this.dao.updateOne(
      { _id: userId },
      { accountLocked: null, accountUnlockCode: null, failedLogins: null }
    );
  }

  async updatePassword(userId: string, password: EncryptedPassword): Promise<void> {
    await this.dao.updateOne({ _id: userId }, { password: password.getValue() });
  }

  async getTwoFactorStatus(userId: string): Promise<ResultType<TwoFactorStatus, UserNotFound>> {
    const row = await this.dao.findOne({ _id: userId }, { fields: ['identity', 'status'] });

    if (!row) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok({ username: row.username, using2fa: Boolean(row.using2fa) });
  }

  async setTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.dao.updateOne({ _id: userId }, { secret });
  }

  async getTwoFactorSecret(userId: string): Promise<ResultType<string | null, UserNotFound>> {
    const row = await this.dao.findOne({ _id: userId }, { fields: ['security'] });

    if (!row) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok(row.secret ?? null);
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await this.dao.updateOne({ _id: userId }, { using2fa: true });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.dao.updateOne({ _id: userId }, { using2fa: false, secret: null });
  }
}

export { PostgresUsersDataSource };
