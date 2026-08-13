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
    // The default scope already excludes both soft-deleted and system users (D5), so this
    // no longer passes a guard filter of its own.
    return this.dao.count();
  }

  async insert(user: UserAccount): Promise<void> {
    await this.dao.insertOne(PostgresUsersMapper.toRow(user));
  }

  async update(user: User): Promise<void> {
    await this.dao.updateOne({ _id: user._id }, PostgresUsersMapper.toRow(user));
  }

  async delete(userIds: string[]): Promise<number> {
    return this.dao.softDelete(userIds);
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
