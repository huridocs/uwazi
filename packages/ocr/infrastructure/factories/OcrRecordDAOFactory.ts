import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoOcrRecordDAO } from '../mongodb/MongoOcrRecordDAO.js';
import { PostgresOcrRecordDAO } from '../postgresql/PostgresOcrRecordDAO.js';

type OcrRecordDAO =
  { backend: 'postgres'; dao: PostgresOcrRecordDAO } | { backend: 'mongo'; dao: MongoOcrRecordDAO };

/**
 * The DAO for the current tenant's backend, chosen by its `postgresCore` flag. Outside an
 * execution context (legacy paths, workers) a fresh transaction manager is built, as the core
 * factories do.
 */
class OcrRecordDAOFactory {
  static default(): OcrRecordDAO {
    const tenant = ExecutionContext.currentTenant;
    const inContext = Boolean(ExecutionContext.getStore());

    if (tenant.featureFlags?.postgresCore) {
      return {
        backend: 'postgres',
        dao: new PostgresOcrRecordDAO({
          tenantId: tenant.name,
          pgTransactionManager: inContext
            ? ExecutionContext.postgresTransactionManager
            : PostgresTransactionManagerFactory.default(),
        }),
      };
    }

    return {
      backend: 'mongo',
      dao: new MongoOcrRecordDAO(
        getConnection(),
        inContext ? ExecutionContext.transactionManager : TransactionManagerFactory.mongo()
      ),
    };
  }
}

export { OcrRecordDAOFactory };
