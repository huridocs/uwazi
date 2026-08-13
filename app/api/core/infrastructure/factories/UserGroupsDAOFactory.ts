import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { UsersDAOFactory } from './UsersDAOFactory.js';

class UserGroupsDAOFactory {
  // Requires postgresUsergroups and postgresUsers to agree. PostgresUserGroupsDAO is handed
  // the users DAO that UsersDAOFactory picks off postgresUsers, and calls
  // usersDAO.findManyByIds() on it — a MongoUsersDAO there would silently resolve members
  // against the wrong database. MongoUserGroupsDAO takes no users DAO: it reads the users
  // guards from UserReadOptions directly, so the two branches are asymmetric by design.
  static default(): MongoUserGroupsDAO | PostgresUserGroupsDAO {
    const tenant = ExecutionContext.currentTenant;
    const postgresUsergroups = Boolean(tenant.featureFlags?.postgresUsergroups);
    const postgresUsers = Boolean(tenant.featureFlags?.postgresUsers);

    if (postgresUsergroups !== postgresUsers) {
      throw new Error(
        'UserGroupsDAO requires the postgresUsergroups and postgresUsers feature flags to be ' +
          `enabled together, but got postgresUsergroups=${postgresUsergroups} and ` +
          `postgresUsers=${postgresUsers} for tenant "${tenant.name}".`
      );
    }

    if (postgresUsergroups) {
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
