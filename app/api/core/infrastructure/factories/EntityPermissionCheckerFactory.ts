import { EntityPermissionChecker } from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { PostgresEntityPermissionChecker } from '../postgresql/entity/PostgresEntityPermissionChecker.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

type Overrides = {
  transactionManager?: MongoTransactionManager;
};

export class EntityPermissionCheckerFactory {
  static default(overrides?: Overrides): EntityPermissionChecker {
    const tenant = ExecutionContext.currentTenant;
    const transactionManager = (overrides?.transactionManager ??
      (ExecutionContext.getStore()
        ? ExecutionContext.transactionManager
        : TransactionManagerFactory.default())) as MongoTransactionManager;

    if (tenant.featureFlags?.postgresEntities) {
      return new PostgresEntityPermissionChecker({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.getStore()
          ? ExecutionContext.postgresTransactionManager
          : PostgresTransactionManagerFactory.default(),
      });
    }

    return new MongoEntityPermissionChecker(getConnection(), transactionManager);
  }
}
