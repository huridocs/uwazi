import {
  TwoFactorStatus,
  UsersDataSource,
} from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import {
  EmailInUse,
  UsernameExists,
  UserNotFound,
  InvalidUnlockCode,
} from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import type { UserRow } from './PostgresUserRow.js';

const notImplemented = (): never => {
  throw new Error('Method not implemented.');
};

class PostgresUsersDataSource extends PostgresDataSource<UserRow> implements UsersDataSource {
  constructor(deps: PostgresDataSourceDeps) {
    super('users', deps);
  }

  async getTwoFactorStatus(userId: string): Promise<ResultType<TwoFactorStatus, UserNotFound>> {
    const row = await this.table.where({ _id: userId }).first();

    if (!row) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok({ username: row.username, using2fa: Boolean(row.using2fa) });
  }

  async setTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.table.where({ _id: userId }).update({ secret });
  }

  async getTwoFactorSecret(userId: string): Promise<ResultType<string | null, UserNotFound>> {
    const row = await this.table.where({ _id: userId }).first();

    if (!row) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok(row.secret ?? null);
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await this.table.where({ _id: userId }).update({ using2fa: true });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.table.where({ _id: userId }).update({ using2fa: false, secret: null });
  }

  async insert(_user: User): Promise<void> {
    return notImplemented();
  }

  async delete(_userIds: string[]): Promise<number> {
    return notImplemented();
  }

  async update(_user: User): Promise<void> {
    return notImplemented();
  }

  async getById(_id: string): Promise<ResultType<User, UserNotFound>> {
    return notImplemented();
  }

  async getByEmail(_email: string): Promise<ResultType<User, UserNotFound>> {
    return notImplemented();
  }

  async countActiveUsers(): Promise<number> {
    return notImplemented();
  }

  async checkUniqueUsername(_user: User): Promise<ResultType<boolean, UsernameExists>> {
    return notImplemented();
  }

  async checkUniqueEmail(_user: User): Promise<ResultType<boolean, EmailInUse>> {
    return notImplemented();
  }

  async findByUsernameAndUnlockCode(
    _username: string,
    _code: string
  ): Promise<ResultType<User, InvalidUnlockCode>> {
    return notImplemented();
  }

  async clearLockFields(_userId: string): Promise<void> {
    return notImplemented();
  }

  async updatePassword(_userId: string, _password: EncryptedPassword): Promise<void> {
    return notImplemented();
  }
}

export { PostgresUsersDataSource };
