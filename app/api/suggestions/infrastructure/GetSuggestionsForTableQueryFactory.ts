import { GetSuggestionsForTableQuery } from '../getSuggestionsForTableQuery/getSuggestionsForTableQuery.js';
import { IXSuggestionsTableQueryServiceFactory } from './IXSuggestionsTableQueryServiceFactory.js';

/**
 * Wires the store-independent table use case over whichever query service the tenant's store
 * provides. Specs construct it through here too, which is what makes
 * `specs/getSuggestionsForTableQuery.spec.ts` a contract every implementation must satisfy.
 */
class GetSuggestionsForTableQueryFactory {
  static default(): GetSuggestionsForTableQuery {
    return new GetSuggestionsForTableQuery(IXSuggestionsTableQueryServiceFactory.default());
  }
}

export { GetSuggestionsForTableQueryFactory };
