import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { PostgresUsersDataSource } from '#api/core/infrastructure/postgresql/user/PostgresUsersDataSource.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UsersDataSourceFactory {
  static default(): UsersDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresUsers) {
      return new PostgresUsersDataSource({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoUsersDataSource({
      dao: UsersDAOFactory.default(),
    });
  }
}

export { UsersDataSourceFactory };
