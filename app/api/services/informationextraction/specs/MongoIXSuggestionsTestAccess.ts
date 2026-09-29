import { Filter } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { Suggestion } from '#api/suggestions/domain/IXSuggestionsDataSource.js';
import {
  definedOnly,
  IXSuggestionsTestAccess,
  SuggestionFilter,
  SuggestionPatch,
} from './IXSuggestionsTestAccess.js';

/** The patch as a `$set`: the flags live under `state`, the run under `modelData`. */
const setFor = ({
  useForTraining,
  trainingSample,
  date,
  obsolete,
  error,
  suggestionsRunTimestamp,
}: SuggestionPatch) =>
  definedOnly({
    useForTraining,
    trainingSample,
    date,
    'state.obsolete': obsolete,
    'state.error': error,
    'modelData.suggestionsRunTimestamp': suggestionsRunTimestamp,
  });

/**
 * Test-only access to `ixsuggestions`, for the handful of filter-shaped reads and writes the
 * specs need and production code does not.
 *
 * It extends `MongoDataSource` and owns its collection rather than going through
 * `IXSuggestionsDataSource`, for the same reason the query services do: a general
 * filter-taking method on the port would reopen exactly the leak the port exists to close,
 * and it would exist only to serve tests.
 *
 * **Not for production code.** Everything production needs is a named operation on the port.
 */
export class MongoIXSuggestionsTestAccess
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsTestAccess
{
  protected collectionName = 'ixsuggestions';

  static default() {
    return new MongoIXSuggestionsTestAccess(getConnection(), TransactionManagerFactory.default(), {
      useSyncedCollection: false,
    });
  }

  async find(filter: SuggestionFilter) {
    return this.getCollection()
      .find(definedOnly(filter) as Filter<Suggestion>)
      .toArray();
  }

  async deleteMany(filter: SuggestionFilter) {
    await this.getCollection().deleteMany(definedOnly(filter) as Filter<Suggestion>);
  }

  async setOnMany(filter: SuggestionFilter, patch: SuggestionPatch) {
    await this.getCollection().updateMany(definedOnly(filter) as Filter<Suggestion>, {
      $set: setFor(patch),
    });
  }
}
