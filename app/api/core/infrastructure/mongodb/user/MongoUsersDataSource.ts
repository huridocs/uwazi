import { ObjectId } from 'mongodb';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
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
import { MongoUsersMapper } from './MongoUsersMapper.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';

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
      { projection: { password: 0, secret: 0, failedLogins: 0, accountUnlockCode: 0 } }
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

  async countActiveUsers(): Promise<number> {
    return this.dao.count(this.dao.notPublicUserFilter());
  }

  async insert(user: User): Promise<void> {
    await this.dao.insertOne(MongoUsersMapper.toDBO(user));
  }

  async update(user: User): Promise<void> {
    const { _id, ...updates } = MongoUsersMapper.toDBO(user);
    await this.dao.updateOne({ _id }, { $set: updates });
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
      { projection: { _id: 1, username: 1, role: 1, email: 1 } }
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
}

export { MongoUsersDataSource };
