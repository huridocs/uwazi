import { Db, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { PUBLIC_USER_ID, User } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import {
  EmailInUse,
  UsernameExists,
  UserNotFound,
  InvalidUnlockCode,
} from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';

class MongoUsersDataSource extends MongoDataSource<UserDBO> implements UsersDataSource {
  protected collectionName = 'users';

  private dao: MongoUsersDAO;

  constructor(deps: { db: Db; transactionManager: TransactionManager; dao: MongoUsersDAO }) {
    super(deps.db, deps.transactionManager);
    this.dao = deps.dao;
  }

  async checkUniqueUsername(user: User) {
    const [userInDb] = await this.dao.get({ username: user.username });

    if (userInDb) {
      return Result.fail(new UsernameExists(user.username));
    }

    return Result.ok(true);
  }

  async checkUniqueEmail(user: User) {
    const [userInDb] = await this.dao.get({ email: user.email });

    if (userInDb) {
      return Result.fail(new EmailInUse(user.email));
    }

    return Result.ok(true);
  }

  async getById(id: string) {
    const result = await this.dao.getById(id);

    if (result.isError()) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(MongoUsersMapper.toDomain(result.getData()));
  }

  async countActiveUsers(): Promise<number> {
    const collection = this.getCollection<UserDBO>();
    const count = await collection.countDocuments({
      deletedAt: { $exists: false },
      _id: { $ne: PUBLIC_USER_ID },
    });
    return count;
  }

  async insert(user: User): Promise<void> {
    await this.getCollection<UserDBO>().insertOne(MongoUsersMapper.toDBO(user));
  }

  async update(user: User): Promise<void> {
    const dbo = MongoUsersMapper.toDBO(user);
    const { _id, ...updates } = dbo;
    await this.getCollection<UserDBO>().updateOne(
      { _id, deletedAt: { $exists: false } },
      { $set: updates }
    );
  }

  async delete(userIds: string[]): Promise<number> {
    if (userIds.length) {
      const collection = this.getCollection<UserDBO>();
      const result = await collection.updateMany(
        { _id: { $in: userIds.map(id => ObjectId.createFromHexString(id)) } },
        { $set: { deletedAt: new Date() } }
      );
      return result.modifiedCount;
    }

    return 0;
  }

  async findByUsernameAndUnlockCode(
    username: string,
    code: string
  ): Promise<ResultType<User, InvalidUnlockCode>> {
    const user = await this.getCollection<UserDBO>().findOne(
      {
        username,
        accountUnlockCode: code,
        deletedAt: { $exists: false },
      },
      { projection: { _id: 1 } }
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
    await this.getCollection<UserDBO>().updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $unset: { accountLocked: 1, accountUnlockCode: 1, failedLogins: 1 } }
    );
  }

  async updatePassword(userId: string, password: EncryptedPassword): Promise<void> {
    await this.getCollection<UserDBO>().updateOne(
      { _id: ObjectId.createFromHexString(userId), deletedAt: { $exists: false } },
      { $set: { password: password.getValue() } }
    );
  }
}

export { MongoUsersDataSource };
