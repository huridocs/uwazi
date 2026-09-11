import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionsTableQueryService } from '../domain/IXSuggestionsTableQueryService.js';
import { MongoIXSuggestionsTableQueryService } from './MongoIXSuggestionsTableQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsTableQueryServiceFactory {
  static default(): IXSuggestionsTableQueryService {
    return new MongoIXSuggestionsTableQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }
}

export { IXSuggestionsTableQueryServiceFactory };
