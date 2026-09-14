import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionsDataSource } from '../domain/IXSuggestionsDataSource.js';
import { MongoIXSuggestionsDataSource } from './MongoIXSuggestionsDataSource.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, the way
 * `FilesDAOFactory` switches on `tenant.featureFlags.postgresCore`.
 */
class IXSuggestionsDAOFactory {
  static default(): IXSuggestionsDataSource {
    return new MongoIXSuggestionsDataSource({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }
}

export { IXSuggestionsDAOFactory };
