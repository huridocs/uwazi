import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { IXModelsDataSource } from '../domain/IXModelsDataSource.js';
import { mongoTransactionManager } from './contextTransactionManagers.js';
import { MongoIXModelsDataSource } from './MongoIXModelsDataSource.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, routed on the tenant's
 * `postgresCore` flag as `IXExtractorsDAOFactory` does.
 */
class IXModelsDAOFactory {
  static default(): IXModelsDataSource {
    return new MongoIXModelsDataSource({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXModelsDAOFactory };
