import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntityAccessPolicyDataSource } from '#api/core/application/contracts/EntityAccessPolicyDataSource.js';
import { MongoEntityAccessPolicyDataSource } from '../mongodb/entityAccessPolicy/MongoEntityAccessPolicyDataSource.js';
import { PostgresEntityAccessPolicyDataSource } from '../postgresql/entityAccessPolicy/PostgresEntityAccessPolicyDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { search } from '#api/search/search.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

export class EntityAccessPolicyDataSourceFactory {
  static default(overrides?: Overrides): EntityAccessPolicyDataSource {
    const tenant = ExecutionContext.currentTenant;
    const transactionManager =
      overrides?.transactionManager ??
      (ExecutionContext.getStore()
        ? ExecutionContext.transactionManager
        : TransactionManagerFactory.mongo());

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresEntityAccessPolicyDataSource({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.getStore()
          ? ExecutionContext.postgresTransactionManager
          : PostgresTransactionManagerFactory.default(),
        transactionManager,
        mongoDb: getConnection(),
      });
    }

    return new MongoEntityAccessPolicyDataSource({
      db: getConnection(),
      transactionManager,
      searchV1: search,
    });
  }
}
