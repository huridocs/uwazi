import { Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';
import { EmailInUse, UsernameExists } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';

class MongoUsersDataSource extends MongoDataSource<UserDBO> implements UsersDataSource {
  protected collectionName = 'users';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  async checkUniqueUsername(user: User) {
    const userInDb = await this.getCollection<UserDBO>().findOne({ username: user.username });
    if (userInDb) {
      return Result.fail(new UsernameExists(user.username));
    }
    return Result.ok(true);
  }

  async checkUniqueEmail(user: User) {
    const userInDb = await this.getCollection<UserDBO>().findOne({ email: user.email });
    if (userInDb) {
      return Result.fail(new EmailInUse(user.email));
    }
    return Result.ok(true);
  }

  async insert(user: User): Promise<void> {
    await this.getCollection<UserDBO>().insertOne(MongoUsersMapper.toDBO(user));
  }
}

export { MongoUsersDataSource };
