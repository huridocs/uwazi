import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { UserGroupsQueryService } from '#api/core/application/contracts/UserGroupsQueryService.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { MongoUsersDAO } from '../mongodb/user/MongoUsersDAO.js';
import { MongoUserGroupsQueryService } from '../mongodb/user/MongoUserGroupsQueryService.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUserGroupsQueryService } from '../postgresql/user/PostgresUserGroupsQueryService.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { resolveUsersBackend } from './usersBackendFlags.js';

class UserGroupsQueryServiceFactory {
  static default(): UserGroupsQueryService {
    const tenant = ExecutionContext.currentTenant;

    if (resolveUsersBackend('UserGroupsQueryService') === 'postgres') {
      const deps = {
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      };

      return new PostgresUserGroupsQueryService({
        dao: new PostgresUserGroupsDAO(deps),
        usersDAO: new PostgresUsersDAO(deps),
      });
    }

    const db = getConnection();
    const transactionManager = TransactionManagerFactory.default();

    return new MongoUserGroupsQueryService({
      dao: new MongoUserGroupsDAO(db, transactionManager),
      usersDAO: new MongoUsersDAO({ db, transactionManager }),
    });
  }
}

export { UserGroupsQueryServiceFactory };
