import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsDataSource } from '../domain/IXSuggestionsDataSource.js';
import { MongoIXSuggestionsDataSource } from './MongoIXSuggestionsDataSource.js';
import { PostgresIXSuggestionsDataSource } from './PostgresIXSuggestionsDataSource.js';

class IXSuggestionsDAOFactory {
  static default(): IXSuggestionsDataSource {
    if (isPostgresCoreActive()) {
      return new PostgresIXSuggestionsDataSource({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXSuggestionsDataSource({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsDAOFactory };
