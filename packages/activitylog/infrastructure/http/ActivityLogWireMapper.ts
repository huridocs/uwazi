import type { ActivityLogGetRequest } from '#shared/types/activityLogApiTypes.js';
import type {
  ActivityLogFilters,
  ActivityLogPage,
  ListedActivity,
} from '../../application/contracts/ActivityLogQueryService.js';
import type { ActivityLogResponse, ActivityLogResponseRow } from './ActivityLogResponse.js';

type RequestQuery = NonNullable<ActivityLogGetRequest['query']>;

class ActivityLogWireMapper {
  static toFilters(query: RequestQuery = {}): ActivityLogFilters {
    return {
      username: query.username,
      find: query.find,
      search: query.search,
      actions: query.method,
      time: query.time && { from: query.time.from, to: query.time.to },
      before: query.before,
      url: query.url,
      query: query.query,
      body: query.body,
      params: query.params,
      sort: query.sort && { prop: query.sort.prop, asc: Boolean(query.sort.asc) },
      page: query.page,
      limit: query.limit,
    };
  }

  static toResponse(page: ActivityLogPage): ActivityLogResponse {
    return {
      rows: page.rows.map(ActivityLogWireMapper.toRow),
      remainingRows: page.remainingRows,
      limit: page.limit,
      page: page.page,
      totalRows: page.totalRows,
    };
  }

  private static toRow(this: void, entry: ListedActivity): ActivityLogResponseRow {
    return {
      _id: entry.id,
      method: entry.method,
      url: entry.url,
      ...(entry.params !== null && { params: entry.params }),
      ...(entry.query !== null && { query: entry.query }),
      ...(entry.body !== null && { body: entry.body }),
      ...(entry.userId !== null && { user: entry.userId }),
      ...(entry.username !== null && { username: entry.username }),
      time: entry.time,
      semantic: entry.semantic,
    };
  }
}

export { ActivityLogWireMapper };
