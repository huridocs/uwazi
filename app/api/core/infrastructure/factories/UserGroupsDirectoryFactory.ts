import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { UserGroupsDirectory } from '#api/core/application/contracts/UserGroupsDirectory.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUserGroupsDAO } from '../mongodb/user/MongoUserGroupsDAO.js';
import { MongoUserGroupsDirectory } from '../mongodb/user/MongoUserGroupsDirectory.js';
import { PostgresUserGroupsDAO } from '../postgresql/user/PostgresUserGroupsDAO.js';
import { PostgresUserGroupsDirectory } from '../postgresql/user/PostgresUserGroupsDirectory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class UserGroupsDirectoryFactory {
  static default(): UserGroupsDirectory {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresUsergroups) {
      return new PostgresUserGroupsDirectory({
        dao: new PostgresUserGroupsDAO({
          tenantId: tenant.name,
          pgTransactionManager: ExecutionContext.postgresTransactionManager,
        }),
      });
    }

    return new MongoUserGroupsDirectory({
      dao: new MongoUserGroupsDAO(getConnection(), TransactionManagerFactory.default()),
    });
  }
}

export { UserGroupsDirectoryFactory };
