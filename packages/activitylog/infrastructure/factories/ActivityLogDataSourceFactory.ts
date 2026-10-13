import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ActivityLogDataSource } from '../../application/contracts/ActivityLogDataSource.js';
import { MongoActivityLogDataSource } from '../mongodb/MongoActivityLogDataSource.js';

/**
 * The activity log has not moved to PostgreSQL: every tenant writes it to MongoDB. It gets a
 * transaction manager of its own, so an entry never joins the transaction of the request it logs —
 * it is written after the request was answered, and must stay even if that transaction is undone.
 */
class ActivityLogDataSourceFactory {
  static default(): ActivityLogDataSource {
    return new MongoActivityLogDataSource(getConnection(), TransactionManagerFactory.mongo());
  }
}

export { ActivityLogDataSourceFactory };
