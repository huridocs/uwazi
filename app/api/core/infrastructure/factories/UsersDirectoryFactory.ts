import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { UsersDirectory } from '#api/core/application/contracts/UsersDirectory.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { MongoUsersDAO } from '../mongodb/user/MongoUsersDAO.js';
import { MongoUsersDirectory } from '../mongodb/user/MongoUsersDirectory.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { PostgresUsersDirectory } from '../postgresql/user/PostgresUsersDirectory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { resolveUsersBackend } from './usersBackendFlags.js';

class UsersDirectoryFactory {
  /**
   * Returns the contract, never an implementation type — this is the only door twelve
   * internal modules get to users, and none of them may know which backend answered (D1/D4).
   *
   * The DAOs are constructed here rather than taken from UsersDAOFactory because both
   * branches need a users DAO *and* a matching user-groups DAO: getProfile/getActor carry
   * groups, which is also why this factory needs the both-flags-agree check (D8).
   */
  static default(): UsersDirectory {
    const tenant = ExecutionContext.currentTenant;

    if (resolveUsersBackend('UsersDirectory') === 'postgres') {
      const usersDAO = new PostgresUsersDAO({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });

      return new PostgresUsersDirectory({
        usersDAO,
        userGroupsDAO: new PostgresUserGroupsDAO({
          tenantId: tenant.name,
          pgTransactionManager: ExecutionContext.postgresTransactionManager,
        }),
      });
    }

    const db = getConnection();
    // Built here rather than taken off ExecutionContext, which throws when there is no
    // context: plan 05 calls this from legacy paths (session deserialization, jobs) that do
    // not all run inside one. Both DAOs share the instance, as they must.
    const transactionManager = TransactionManagerFactory.default();

    return new MongoUsersDirectory({
      usersDAO: new MongoUsersDAO({ db, transactionManager }),
      userGroupsDAO: new MongoUserGroupsDAO(db, transactionManager),
    });
  }
}

export { UsersDirectoryFactory };
