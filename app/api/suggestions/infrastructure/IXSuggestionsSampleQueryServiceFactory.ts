import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsSampleQueryService } from '../domain/IXSuggestionsSampleQueryService.js';
import { MongoIXSuggestionsSampleQueryService } from './MongoIXSuggestionsSampleQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsSampleQueryServiceFactory {
  static default(): IXSuggestionsSampleQueryService {
    return new MongoIXSuggestionsSampleQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsSampleQueryServiceFactory };
