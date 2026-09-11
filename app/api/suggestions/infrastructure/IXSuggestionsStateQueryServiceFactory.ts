import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsStateQueryService } from '../domain/IXSuggestionsStateQueryService.js';
import { MongoIXSuggestionsStateQueryService } from './MongoIXSuggestionsStateQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsStateQueryServiceFactory {
  static default(): IXSuggestionsStateQueryService {
    return new MongoIXSuggestionsStateQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsStateQueryServiceFactory };
