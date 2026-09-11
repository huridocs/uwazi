import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsTableQueryService } from '../domain/IXSuggestionsTableQueryService.js';
import { MongoIXSuggestionsTableQueryService } from './MongoIXSuggestionsTableQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsTableQueryServiceFactory {
  static default(): IXSuggestionsTableQueryService {
    return new MongoIXSuggestionsTableQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsTableQueryServiceFactory };
