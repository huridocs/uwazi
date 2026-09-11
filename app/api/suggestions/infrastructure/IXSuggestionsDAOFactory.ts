import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsDataSource } from '../domain/IXSuggestionsDataSource.js';
import { MongoIXSuggestionsDataSource } from './MongoIXSuggestionsDataSource.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, routed on the tenant's
 * `postgresCore` flag as `IXExtractorsDAOFactory` does.
 */
class IXSuggestionsDAOFactory {
  static default(): IXSuggestionsDataSource {
    return new MongoIXSuggestionsDataSource({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsDAOFactory };
