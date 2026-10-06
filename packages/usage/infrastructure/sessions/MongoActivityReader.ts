import type { Db } from 'mongodb';
import type { ActivityReader } from '../../application/contracts/ActivityReader.js';

type SessionDBO = { _id: string; session: string; lastModified?: Date; expires: Date };

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * connect-mongo sessions in the shared database. The tenant is only inside the serialized
 * session, as passport's `<userId>///<tenant>`, so this matches on the string.
 */
class MongoActivityReader implements ActivityReader {
  constructor(private readonly deps: { sharedDb: Db; ttlMs: number }) {}

  async lastSession(tenantName: string): Promise<number | null> {
    const [latest] = await this.deps.sharedDb
      .collection<SessionDBO>('sessions')
      .aggregate<{ lastActive: Date }>([
        { $match: { session: { $regex: `"user":"[^"]*///${escapeRegExp(tenantName)}"` } } },
        {
          $group: {
            _id: null,
            lastActive: {
              $max: {
                $ifNull: ['$lastModified', { $subtract: ['$expires', this.deps.ttlMs] }],
              },
            },
          },
        },
      ])
      .toArray();

    return latest?.lastActive ? latest.lastActive.getTime() : null;
  }
}

export { MongoActivityReader };
