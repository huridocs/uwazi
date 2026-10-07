import type { Db } from 'mongodb';

/** An `archives` row as the archive playbook stored it. */
type ArchivedTenantRecord = Record<string, unknown>;

const SORT_KEY = '__archivedAtSortKey';

/**
 * Reads the archived tenants the archive playbook keeps in the shared database. Who owns them is
 * undecided, so this lives in the CLI and reads Mongo only.
 */
class ArchivedTenantsQueryService {
  constructor(private readonly db: Db) {}

  /**
   * Every archived tenant as stored, newest `archivedAt` first, ties by name. `archivedAt` is
   * stored as epoch seconds, as a string or a number, and Mongo orders mixed types by type before
   * value, so the sort runs on a converted copy. Missing or unreadable values convert to null and
   * sort last.
   */
  async newestFirst(): Promise<ArchivedTenantRecord[]> {
    return this.db
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
}

export { ArchivedTenantsQueryService };
export type { ArchivedTenantRecord };
