import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UserGroupsDAOFactory {
  static default(): MongoUserGroupsDAO | PostgresUserGroupsDAO {
    const tenant = ExecutionContext.currentTenant;
    const usersDAO = UsersDAOFactory.default();

    if (tenant.featureFlags?.postgresUsergroups) {
      return new PostgresUserGroupsDAO({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        usersDAO: usersDAO as any as PostgresUsersDAO,
      });
    }

    return new MongoUserGroupsDAO(getConnection(), ExecutionContext.transactionManager, usersDAO);
  }
}

export { UserGroupsDAOFactory };
