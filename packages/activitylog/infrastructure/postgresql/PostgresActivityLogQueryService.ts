import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import type { ActivityDescriber } from '../query/ActivityDescriber.js';
import type {
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogQueryService,
  ActivityLogSummary,
  ListedActivity,
} from '../query/ActivityLogQueryService.js';
import { PostgresActivityLogFilter } from './PostgresActivityLogFilter.js';
import { PostgresActivityLogRow } from './PostgresActivityLogRow.js';

const DEFAULT_LIMIT = 15;

/** Newest first, the last stored first among entries made at the same time. */
const NEWEST_FIRST = '"time" DESC, "_id" DESC';

/** The `activitylogs` table; tenant isolation is its row-level security policy. */
class PostgresActivityLogQueryService
  extends PostgresDataSource<PostgresActivityLogRow>
  implements ActivityLogQueryService
{
  constructor(
    deps: PostgresDataSourceDeps,
    private readonly describer: ActivityDescriber
  ) {
    super('activitylogs', deps);
  }

  async recent({ limit }: { limit: number }): Promise<ActivityLogSummary[]> {
    const rows = await this.table
      .query()
      .select(['method', 'url', 'username', 'time'])
      .orderByRaw(NEWEST_FIRST)
      .limit(limit)
      .all();

    return rows.map(({ method, url, username, time }) => ({
      method,
      url,
      username: username ?? null,
      time: Number(time),
    }));
  }

  async list(filters: ActivityLogFilters): Promise<ActivityLogPage> {
    const limit = filters.limit || DEFAULT_LIMIT;
    const skip = filters.page ? (filters.page - 1) * limit : 0;

    const totalRows = await this.matching(filters).count();
    const rows = await this.matching(filters)
      .orderByRaw(PostgresActivityLogQueryService.orderBy(filters.sort))
      .offset(skip)
      .limit(limit)
      .all();

    return {
      rows: await this.described(rows),
      totalRows,
      remainingRows: Math.max(0, totalRows - rows.length - skip),
      limit,
      page: filters.page,
    };
  }

  private matching(filters: ActivityLogFilters) {
    const condition = PostgresActivityLogFilter.build(filters);
    const query = this.table.query();
    return condition ? query.whereRaw(condition.sql, condition.bindings) : query;
  }

  /**
   * Text is ordered without regard to case and entries without a value come first, as in Mongo;
   * entries equal on the property stay newest first.
   */
  private static orderBy(
    { prop, asc }: NonNullable<ActivityLogFilters['sort']> = {
      prop: 'time',
      asc: false,
    }
  ): string {
    if (prop === 'time') return asc ? '"time" ASC, "_id" ASC' : NEWEST_FIRST;

    const direction = asc ? 'ASC NULLS FIRST' : 'DESC NULLS LAST';
    return `lower("${prop}") ${direction}, ${NEWEST_FIRST}`;
  }

  /** One at a time: describing an entry reads from other modules. */
  private async described(rows: PostgresActivityLogRow[]): Promise<ListedActivity[]> {
    return rows.reduce<Promise<ListedActivity[]>>(async (previous, row) => {
      const described = await previous;
      const semantic = await this.describer.describe({
        method: row.method,
        url: row.url,
        body: row.body,
        query: row.query,
      });
      return [...described, { ...PostgresActivityLogQueryService.toReadModel(row), semantic }];
    }, Promise.resolve([]));
  }

  private static toReadModel(row: PostgresActivityLogRow): Omit<ListedActivity, 'semantic'> {
    return {
      id: row._id,
      method: row.method,
      url: row.url,
      params: row.params ?? null,
      query: row.query ?? null,
      body: row.body ?? null,
      userId: row.user_id ?? null,
      username: row.username ?? null,
      time: Number(row.time),
    };
  }
}

export { PostgresActivityLogQueryService };
