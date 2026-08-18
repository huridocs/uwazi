import { ObjectId } from 'mongodb';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
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
import { MongoUsersMapper } from './MongoUsersMapper.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import type { UserFieldGroup } from './UserReadOptions.js';

/** Everything UserAccount's Credentials need: password, secret, lockout state and using2fa. */
const ACCOUNT_FIELDS: UserFieldGroup[] = ['identity', 'status', 'credentials', 'security'];

class MongoUsersDataSource implements UsersDataSource {
  private dao: MongoUsersDAO;

  constructor(deps: { dao: MongoUsersDAO }) {
    this.dao = deps.dao;
  }

  async checkUniqueUsername(user: User) {
    const exists = await this.dao.exists({ username: user.username });

    if (exists) {
      return Result.fail(new UsernameExists(user.username));
    }

    return Result.ok(true);
  }

  async checkUniqueEmail(user: User) {
    const exists = await this.dao.exists({ email: user.email });

    if (exists) {
      return Result.fail(new EmailInUse(user.email));
    }

    return Result.ok(true);
  }

  async getById(id: string) {
    const user = await this.dao.findOne(
      { _id: ObjectId.createFromHexString(id) },
      { fields: ['identity', 'status'] }
    );

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(MongoUsersMapper.toDomain(user));
  }

  async getByEmail(email: string): Promise<ResultType<User, UserNotFound>> {
    const user = await this.dao.findOne({ email });

    if (!user) {
      return Result.fail(new UserNotFound(email));
    }

    return Result.ok(MongoUsersMapper.toDomain(user));
  }

  async getByUsername(username: string): Promise<ResultType<UserAccount, UserNotFound>> {
    const user = await this.dao.findOne({ username }, { fields: ACCOUNT_FIELDS });

    if (!user) {
      return Result.fail(new UserNotFound(username));
    }

    return Result.ok(MongoUsersMapper.toAccountDomain(user));
  }

  async getAccountById(id: string): Promise<ResultType<UserAccount, UserNotFound>> {
    const user = await this.dao.findOne(
      { _id: ObjectId.createFromHexString(id) },
      { fields: ACCOUNT_FIELDS }
    );

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(MongoUsersMapper.toAccountDomain(user));
  }

  async countActiveUsers(): Promise<number> {
    // The default scope already excludes both soft-deleted and system users (D5), so this
    // no longer passes a guard filter of its own.
    return this.dao.count();
  }

  async insert(user: UserAccount): Promise<void> {
    await this.dao.insertOne(MongoUsersMapper.toDBO(user));
  }

  async update(user: User): Promise<void> {
    const { _id, ...updates } = MongoUsersMapper.toDBO(user);

    if (!(user instanceof UserAccount)) {
      await this.dao.updateOne({ _id }, { $set: updates });
      return;
    }

    // accountUnlockCode has no value once lockout is cleared — $set skips undefined keys, so
    // it needs an explicit $unset or a stale unlock code lingers in the document.
    const { accountUnlockCode, ...rest } = updates;
    await this.dao.updateOne(
      { _id },
      accountUnlockCode
        ? { $set: { ...rest, accountUnlockCode } }
        : { $set: rest, $unset: { accountUnlockCode: 1 } }
    );
  }

  async delete(userIds: string[]): Promise<number> {
    return this.dao.softDelete(userIds);
  }

  async findByUsernameAndUnlockCode(
    username: string,
    code: string
  ): Promise<ResultType<User, InvalidUnlockCode>> {
    const user = await this.dao.findOne(
      { username, accountUnlockCode: code },
      { fields: ['identity'] }
    );

    if (!user) {
      return Result.fail(new InvalidUnlockCode());
    }

    return Result.ok(
      new User({
        _id: user._id.toHexString(),
        username: user.username,
        role: user.role,
        email: user.email,
      })
    );
  }

  async clearLockFields(userId: string): Promise<void> {
    await this.dao.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
    );
  }

  async updatePassword(userId: string, password: EncryptedPassword): Promise<void> {
    await this.dao.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { password: password.getValue() } }
    );
  }

  async getTwoFactorStatus(userId: string) {
    const user = await this.dao.findOne(
      { _id: ObjectId.createFromHexString(userId) },
      { fields: ['identity', 'status'] }
    );

    if (!user) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok({ username: user.username, using2fa: Boolean(user.using2fa) });
  }

  async setTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.dao.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { secret } });
  }

  async getTwoFactorSecret(userId: string) {
    const user = await this.dao.findOne(
      { _id: ObjectId.createFromHexString(userId) },
      { fields: ['security'] }
    );

    if (!user) {
      return Result.fail(new UserNotFound(userId));
    }

    return Result.ok(user.secret ?? null);
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await this.dao.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { using2fa: true } }
    );
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.dao.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { using2fa: false, secret: null } }
    );
  }
}

export { MongoUsersDataSource };
