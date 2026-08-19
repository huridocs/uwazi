import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';
import { resolveUsersBackend } from './usersBackendFlags.js';

class UserGroupsDAOFactory {
  // Requires postgresUsergroups and postgresUsers to agree, via the same resolveUsersBackend
  // the two read-contract factories use (D8). PostgresUserGroupsDAO is handed the users DAO
  // that UsersDAOFactory picks off postgresUsers, and calls usersDAO.findManyByIds() on it —
  // a MongoUsersDAO there would silently resolve members against the wrong database.
  // MongoUserGroupsDAO takes no users DAO: it reads the users guards from UserReadOptions
  // directly, so the two branches are asymmetric by design.
  static default(): MongoUserGroupsDAO | PostgresUserGroupsDAO {
    const tenant = ExecutionContext.currentTenant;

    if (resolveUsersBackend('UserGroupsDAO') === 'postgres') {
      return new PostgresUserGroupsDAO({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        usersDAO: UsersDAOFactory.default() as any as PostgresUsersDAO,
      });
    }

    return new MongoUserGroupsDAO(getConnection(), ExecutionContext.transactionManager);
  }
}

export { UserGroupsDAOFactory };
