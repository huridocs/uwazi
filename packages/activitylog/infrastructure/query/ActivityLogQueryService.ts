import type { ActivityDescription } from './ActivityDescription.js';

//cc: this contract should be moved to infrastructure folder, inside a query/ folder where there should have the adapter for mongo and postgresql

/** One request the API logged. The request's own details (body, query, params) are not part of it. */
type ActivityLogSummary = {
  method: string;
  url: string;
  username: string | null;
  time: number;
};

/** One logged request with everything it carried and a description of what it did. */
type ListedActivity = {
  id: string;
  method: string;
  url: string;
  params: string | null;
  query: string | null;
  body: string | null;
  userId: string | null;
  username: string | null;
  time: number;
  semantic: ActivityDescription;
};

type ActivityLogSortProperty = 'method' | 'time' | 'username' | 'url';

type ActivityLogFilters = {
  username?: string;
  find?: string;
  search?: string;
  actions?: string[];
  time?: { from?: number; to?: number };
  before?: number;
  url?: string;
  query?: string;
  body?: string;
  params?: string;
  sort?: { prop: ActivityLogSortProperty; asc: boolean };
  page?: number;
  limit?: number;
};

type ActivityLogPage = {
  rows: ListedActivity[];
  totalRows: number;
  remainingRows: number;
  limit: number;
  page?: number;
};

/** What the screen and the CLI read from a tenant's activity log. */
interface ActivityLogQueryService {
  recent(query: { limit: number }): Promise<ActivityLogSummary[]>;
  list(filters: ActivityLogFilters): Promise<ActivityLogPage>;
}

export type {
  ActivityLogFilters,
  ActivityLogPage,
  ActivityLogQueryService,
  ActivityLogSortProperty,
  ActivityLogSummary,
  ListedActivity,
};
