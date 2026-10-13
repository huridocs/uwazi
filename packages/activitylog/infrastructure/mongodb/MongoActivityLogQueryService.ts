import type { Db, Sort } from 'mongodb';
import type { ActivityDescriber } from '../../application/ActivityDescriber.js';
import type {
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogQueryService,
  ActivityLogSummary,
  ListedActivity,
} from '../../application/contracts/ActivityLogQueryService.js';
import type { MongoActivityLogDBO } from './MongoActivityLogDBO.js';
import { MongoActivityLogFilter } from './MongoActivityLogFilter.js';

const DEFAULT_LIMIT = 15;

/** Usernames are sorted without regard to case. */
const COLLATION = { locale: 'en', strength: 2 };

class MongoActivityLogQueryService implements ActivityLogQueryService {
  constructor(
    private readonly db: Db,
    private readonly describer: ActivityDescriber
  ) {}

  async recent({ limit }: { limit: number }): Promise<ActivityLogSummary[]> {
    const entries = await this.collection
      .find({}, { projection: { _id: 0, method: 1, url: 1, username: 1, time: 1 } })
      .sort({ time: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return entries.map(({ method, url, username, time }) => ({
      method,
      url,
      username: username ?? null,
      time,
    }));
  }

  async list(filters: ActivityLogFilters): Promise<ActivityLogPage> {
    const query = MongoActivityLogFilter.build(filters);
    const limit = filters.limit || DEFAULT_LIMIT;
    const skip = filters.page ? (filters.page - 1) * limit : 0;

    const totalRows = await this.collection.countDocuments(query);
    const entries = await this.collection
      .find(query, { collation: COLLATION })
      .sort(MongoActivityLogQueryService.sortBy(filters.sort))
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      rows: await this.described(entries),
      totalRows,
      remainingRows: Math.max(0, totalRows - entries.length - skip),
      limit,
      page: filters.page,
    };
  }

  private get collection() {
    return this.db.collection<MongoActivityLogDBO>('activitylogs');
  }

  private static sortBy(
    { prop, asc }: NonNullable<ActivityLogFilters['sort']> = {
      prop: 'time',
      asc: false,
    }
  ): Sort {
    return { [prop]: asc ? 1 : -1, ...(prop !== 'time' && { time: -1 }) };
  }

  /** One at a time: describing an entry reads from other modules. */
  private async described(entries: MongoActivityLogDBO[]): Promise<ListedActivity[]> {
    return entries.reduce<Promise<ListedActivity[]>>(async (previous, entry) => {
      const rows = await previous;
      const semantic = await this.describer.describe({
        method: entry.method,
        url: entry.url,
        body: entry.body,
        query: entry.query,
      });
      return [...rows, { ...MongoActivityLogQueryService.toReadModel(entry), semantic }];
    }, Promise.resolve([]));
  }

  private static toReadModel(entry: MongoActivityLogDBO): Omit<ListedActivity, 'semantic'> {
    return {
      id: entry._id.toString(),
      method: entry.method,
      url: entry.url,
      params: entry.params ?? null,
      query: entry.query ?? null,
      body: entry.body ?? null,
      userId: entry.user ? entry.user.toString() : null,
      username: entry.username ?? null,
      time: entry.time,
    };
  }
}

export { MongoActivityLogQueryService };
