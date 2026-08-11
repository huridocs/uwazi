import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersQueryService } from '../mongodb/user/MongoUsersQueryService.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { PostgresUsersQueryService } from '../postgresql/user/PostgresUsersQueryService.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { UserGroupsDAOFactory } from './UserGroupsDAOFactory.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UsersQueryServiceFactory {
  static default(): MongoUsersQueryService {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresUsers && tenant.featureFlags?.postgresUsergroups) {
      return new PostgresUsersQueryService({
        usersDAO: UsersDAOFactory.default() as any as PostgresUsersDAO,
        userGroupsDAO: UserGroupsDAOFactory.default() as PostgresUserGroupsDAO,
      }) as any as MongoUsersQueryService;
    }

    return new MongoUsersQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
      dao: UsersDAOFactory.default(),
    });
  }
}

export { UsersQueryServiceFactory };
