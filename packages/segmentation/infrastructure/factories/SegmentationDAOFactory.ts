import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoSegmentationDAO } from '../mongodb/MongoSegmentationDAO.js';
import { PostgresSegmentationDAO } from '../postgresql/PostgresSegmentationDAO.js';

type SegmentationDAO =
  | { backend: 'postgres'; dao: PostgresSegmentationDAO }
  | { backend: 'mongo'; dao: MongoSegmentationDAO };

/**
 * The DAO for the current tenant's backend, chosen by its `postgresCore` flag. Outside an
 * execution context (legacy paths, workers) a fresh transaction manager is built, as the core
 * factories do.
 */
class SegmentationDAOFactory {
  static default(): SegmentationDAO {
    const tenant = ExecutionContext.currentTenant;
    const inContext = Boolean(ExecutionContext.getStore());

    if (tenant.featureFlags?.postgresCore) {
      return {
        backend: 'postgres',
        dao: new PostgresSegmentationDAO({
          tenantId: tenant.name,
          pgTransactionManager: inContext
            ? ExecutionContext.postgresTransactionManager
            : PostgresTransactionManagerFactory.default(),
        }),
      };
    }

    return {
      backend: 'mongo',
      dao: new MongoSegmentationDAO(
        getConnection(),
        inContext ? ExecutionContext.transactionManager : TransactionManagerFactory.mongo()
      ),
    };
  }
}

export { SegmentationDAOFactory };
