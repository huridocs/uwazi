import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionsStateQueryService } from '../domain/IXSuggestionsStateQueryService.js';
import { MongoIXSuggestionsStateQueryService } from './MongoIXSuggestionsStateQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsStateQueryServiceFactory {
  static default(): IXSuggestionsStateQueryService {
    return new MongoIXSuggestionsStateQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }
}

export { IXSuggestionsStateQueryServiceFactory };
