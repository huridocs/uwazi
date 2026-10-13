import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ActivityLogDataSource } from '../../application/contracts/ActivityLogDataSource.js';
import { MongoActivityLogDataSource } from '../mongodb/MongoActivityLogDataSource.js';
import { PostgresActivityLogDataSource } from '../postgresql/PostgresActivityLogDataSource.js';

/**
 * The data source for the current tenant's backend, chosen by its `postgresCore` flag. It gets a
 * transaction manager of its own, so an entry never joins the transaction of the request it logs —
 * it is written after the request was answered, and must stay even if that transaction is undone.
 */
class ActivityLogDataSourceFactory {
  static default(): ActivityLogDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresActivityLogDataSource({
        tenantId: tenant.name,
        pgTransactionManager: PostgresTransactionManagerFactory.default(),
        accessContext: ExecutionContext.accessContext,
      });
    }

    return new MongoActivityLogDataSource(getConnection(), TransactionManagerFactory.mongo());
  }
}

export { ActivityLogDataSourceFactory };
