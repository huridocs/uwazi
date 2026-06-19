import { Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { User } from '#api/core/domain/user/User.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';

class MongoUsersDataSource extends MongoDataSource<UserDBO> implements UsersDataSource {
  protected collectionName = 'users';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  // email cannot repeat!
  async userExists(user: User): Promise<Boolean> {
    const userInDb = await this.getCollection<UserDBO>().findOne({ username: user.username });
    return Boolean(userInDb);
  }

  // here we need to update the groups with the user if it has any
  async insert(user: User): Promise<void> {
    await this.getCollection<UserDBO>().insertOne(MongoUsersMapper.toDBO(user));
  }
}

export { MongoUsersDataSource };
