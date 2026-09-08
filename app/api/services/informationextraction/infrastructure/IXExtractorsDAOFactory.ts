import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXExtractorsDataSource } from '../domain/IXExtractorsDataSource.js';
import { MongoIXExtractorsDataSource } from './MongoIXExtractorsDataSource.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, the way
 * `FilesDAOFactory` switches on `tenant.featureFlags.postgresCore`. Until then there is one
 * implementation and no flag to read.
 */
class IXExtractorsDAOFactory {
  static default(): IXExtractorsDataSource {
    return new MongoIXExtractorsDataSource({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { IXExtractorsDAOFactory };
