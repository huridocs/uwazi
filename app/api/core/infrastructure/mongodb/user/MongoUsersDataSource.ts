import { Db, ObjectId } from 'mongodb';
import { MongoDSOptions } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { PUBLIC_USER_ID, User } from '#api/core/domain/user/User.js';
import { EmailInUse, UsernameExists } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';

class MongoUsersDataSource extends MongoUsersDAO implements UsersDataSource {
  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  async checkUniqueUsername(user: User) {
    const [userInDb] = await this.get({ username: user.username });

    if (userInDb) {
      return Result.fail(new UsernameExists(user.username));
    }

    return Result.ok(true);
  }

  async checkUniqueEmail(user: User) {
    const [userInDb] = await this.get({ email: user.email });

    if (userInDb) {
      return Result.fail(new EmailInUse(user.email));
    }

    return Result.ok(true);
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
}

export { MongoUsersDataSource };
