import { Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';

class MongoUsersDataSource extends MongoDataSource implements UsersDataSource {
  protected collectionName = 'users';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  async userExists(user: User): Promise<Boolean> {
    const userInDb = this.getCollection<User>().findOne({ username: user.username });
    return Boolean(userInDb);
  }

  // here we need to update the groups with the user if it has any
  async insert(user: User): Promise<void> {
    await this.getCollection<User>().insertOne(user);
  }
}

export { MongoUsersDataSource };
