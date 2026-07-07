import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class UsersDataSourceFactory {
  static default(): UsersDataSource {
    return new MongoUsersDataSource({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { UsersDataSourceFactory };
