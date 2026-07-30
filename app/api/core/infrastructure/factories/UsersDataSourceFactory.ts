import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UsersDataSourceFactory {
  static default(): UsersDataSource {
    return new MongoUsersDataSource({
      dao: UsersDAOFactory.default(),
    });
  }
}

export { UsersDataSourceFactory };
