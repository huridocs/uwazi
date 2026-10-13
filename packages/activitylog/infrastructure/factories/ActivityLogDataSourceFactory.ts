import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ActivityLogDataSource } from '../../application/contracts/ActivityLogDataSource.js';
import { MongoActivityLogDataSource } from '../mongodb/MongoActivityLogDataSource.js';

/**
 * The activity log has not moved to PostgreSQL: every tenant writes it to MongoDB. Outside an
 * execution context (legacy paths, workers) a fresh transaction manager is built, as the core
 * factories do.
 */
class ActivityLogDataSourceFactory {
  static default(): ActivityLogDataSource {
    const inContext = Boolean(ExecutionContext.getStore());

    return new MongoActivityLogDataSource(
      getConnection(),
      inContext ? ExecutionContext.transactionManager : TransactionManagerFactory.mongo()
    );
  }
}

export { ActivityLogDataSourceFactory };
