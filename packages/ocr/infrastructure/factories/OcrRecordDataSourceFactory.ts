import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { MongoOcrRecordDataSource } from '../mongodb/MongoOcrRecordDataSource.js';
import { PostgresOcrRecordDataSource } from '../postgresql/PostgresOcrRecordDataSource.js';

/**
 * The data source for the current tenant's backend, chosen by its `postgresCore` flag. Outside an
 * execution context (legacy paths, workers) a fresh transaction manager is built, as the core
 * factories do.
 */
class OcrRecordDataSourceFactory {
  static default(): OcrRecordDataSource {
    const tenant = ExecutionContext.currentTenant;
    const inContext = Boolean(ExecutionContext.getStore());

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresOcrRecordDataSource({
        tenantId: tenant.name,
        pgTransactionManager: inContext
          ? ExecutionContext.postgresTransactionManager
          : PostgresTransactionManagerFactory.default(),
      });
    }

    return new MongoOcrRecordDataSource(
      getConnection(),
      inContext ? ExecutionContext.transactionManager : TransactionManagerFactory.mongo()
    );
  }
}

export { OcrRecordDataSourceFactory };
