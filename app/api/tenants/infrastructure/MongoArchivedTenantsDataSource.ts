import type { Db } from 'mongodb';
import type {
  ArchivedTenantRecord,
  ArchivedTenantsDataSource,
} from '../application/contracts/ArchivedTenantsDataSource.js';

const SORT_KEY = '__archivedAtSortKey';

/**
 * The Mongo backend: the `archives` collection of the shared database. `archivedAt` is stored as
 * epoch seconds, as a string or a number, and Mongo orders mixed types by type before value, so
 * the sort runs on a converted copy. Missing or unreadable values convert to null and sort last.
 */
class MongoArchivedTenantsDataSource implements ArchivedTenantsDataSource {
  constructor(private readonly db: () => Db) {}

  async newestFirst(): Promise<ArchivedTenantRecord[]> {
    return this.db()
      .collection('archives')
      .aggregate<ArchivedTenantRecord>([
        {
          $addFields: {
            [SORT_KEY]: {
              $convert: { input: '$archivedAt', to: 'long', onError: null, onNull: null },
            },
          },
        },
        { $sort: { [SORT_KEY]: -1, name: 1 } },
        { $unset: SORT_KEY },
      ])
      .toArray();
  }

  async getByName(name: string): Promise<ArchivedTenantRecord | undefined> {
    return (await this.db().collection('archives').findOne({ name })) ?? undefined;
  }

  /** Replaces the whole document, so fields the new row lacks are gone, and returns it as stored.
   * `name` is written explicitly: Mongo does not copy the filter into the replacement on an
   * upsert, so a nameless row would otherwise be stored without a name. */
  async upsert(name: string, row: ArchivedTenantRecord): Promise<ArchivedTenantRecord> {
    return (await this.db()
      .collection('archives')
      .findOneAndReplace(
        { name },
        { ...row, name },
        {
          upsert: true,
          returnDocument: 'after',
        }
      )) as ArchivedTenantRecord;
  }

  async delete(name: string): Promise<boolean> {
    const { deletedCount } = await this.db().collection('archives').deleteOne({ name });
    return deletedCount > 0;
  }
}

export { MongoArchivedTenantsDataSource };
