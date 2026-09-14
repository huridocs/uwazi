import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXModelsDataSource } from '../domain/IXModelsDataSource.js';
import { MongoIXModelsDataSource } from './MongoIXModelsDataSource.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, the way
 * `FilesDAOFactory` switches on `tenant.featureFlags.postgresCore`. Until then there is one
 * implementation and no flag to read.
 */
class IXModelsDAOFactory {
  static default(): IXModelsDataSource {
    return new MongoIXModelsDataSource({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }
}

export { IXModelsDAOFactory };
