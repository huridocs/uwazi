import { Filter } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { Suggestion } from '#api/suggestions/domain/IXSuggestionsDataSource.js';

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
export class MongoIXSuggestionsTestAccess extends MongoDataSource<Suggestion> {
  protected collectionName = 'ixsuggestions';

  static default() {
    return new MongoIXSuggestionsTestAccess(getConnection(), TransactionManagerFactory.default(), {
      useSyncedCollection: false,
    });
  }

  async find(filter: Filter<Suggestion>) {
    return this.getCollection().find(filter).toArray();
  }

  async deleteMany(filter: Filter<Suggestion>) {
    await this.getCollection().deleteMany(filter);
  }

  async setOnMany(filter: Filter<Suggestion>, values: Record<string, unknown>) {
    await this.getCollection().updateMany(filter, { $set: values } as any);
  }
}
