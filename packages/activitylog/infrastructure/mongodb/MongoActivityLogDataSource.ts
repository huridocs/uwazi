import { Db, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { ActivityLogDataSource } from '../../application/contracts/ActivityLogDataSource.js';
import { ActivityLogEntry } from '../../domain/ActivityLogEntry.js';
import { MongoActivityLogDBO } from './MongoActivityLogDBO.js';

const YEARS_KEPT = 1;

/**
 * The `activitylogs` collection. Entries are never synced to other instances, so writes skip the
 * sync log. How long an entry lives is this backend's concern: each is stamped with the date the
 * TTL index deletes it on.
 */
class MongoActivityLogDataSource
  extends MongoDataSource<MongoActivityLogDBO>
  implements ActivityLogDataSource
{
  protected collectionName = 'activitylogs';

  constructor(db: Db, transactionManager: TransactionManager) {
    super(db, transactionManager, { useSyncedCollection: false });
  }

  async append(entry: ActivityLogEntry): Promise<void> {
    await this.getCollection().insertOne(MongoActivityLogDataSource.toDBO(entry));
  }

  async count(): Promise<number> {
    return this.getCollection().countDocuments();
  }

  async oldest(limit: number): Promise<ActivityLogEntry[]> {
    const documents = await this.getCollection()
      .find({}, { session: this.getSession() })
      .sort({ time: 1, _id: 1 })
      .limit(limit)
      .toArray();

    return documents.map(MongoActivityLogDataSource.toEntry);
  }

  async remove(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    await this.getCollection().deleteMany({
      _id: { $in: entries.map(({ props }) => new ObjectId(props.id)) },
    });
  }

  private static toEntry(this: void, document: MongoActivityLogDBO): ActivityLogEntry {
    return ActivityLogEntry.restore({
      id: document._id.toHexString(),
      method: document.method,
      url: document.url,
      params: document.params ?? null,
      query: document.query ?? null,
      body: document.body ?? null,
      userId: document.user ? document.user.toHexString() : null,
      username: document.username ?? null,
      time: document.time,
    });
  }

  private static toDBO({ props }: ActivityLogEntry): MongoActivityLogDBO {
    return {
      _id: new ObjectId(props.id),
      method: props.method,
      url: props.url,
      ...(props.params !== null && { params: props.params }),
      ...(props.query !== null && { query: props.query }),
      ...(props.body !== null && { body: props.body }),
      ...(props.userId !== null && { user: new ObjectId(props.userId) }),
      ...(props.username !== null && { username: props.username }),
      time: props.time,
      expireAt: MongoActivityLogDataSource.expiryOf(props.time),
    };
  }

  /** Midnight of the day the entry was recorded, a year on. */
  private static expiryOf(time: number): Date {
    const expiry = new Date(time);
    expiry.setHours(0, 0, 0, 0);
    expiry.setFullYear(expiry.getFullYear() + YEARS_KEPT);
    return expiry;
  }
}

export { MongoActivityLogDataSource };
