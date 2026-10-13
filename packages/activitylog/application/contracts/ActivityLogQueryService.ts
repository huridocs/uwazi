import type { ActivityDescription } from '../ActivityDescription.js';

/** One request the API logged. The request's own details (body, query, params) are not part of it. */
type ActivityLogSummary = {
  method: string;
  url: string;
  /** null for a request made without a user. */
  username: string | null;
  /** Epoch ms. */
  time: number;
};

/** One logged request with everything it carried and a description of what it did. */
type ListedActivity = {
  id: string;
  method: string;
  url: string;
  /** JSON; null on entries stored without it. */
  params: string | null;
  query: string | null;
  body: string | null;
  /** null for a request made without a user. */
  userId: string | null;
  username: string | null;
  /** Epoch ms. */
  time: number;
  semantic: ActivityDescription;
};

type ActivityLogSortProperty = 'method' | 'time' | 'username' | 'url';

type ActivityLogFilters = {
  /** The exact username, or `anonymous` for requests made without a user. */
  username?: string;
  /** Text anywhere in the method, path, query, body or params, whatever its case. */
  find?: string;
  /** Text of a description; when no description contains it, text anywhere in the request. */
  search?: string;
  /** HTTP methods, or CREATE and UPDATE. */
  actions?: string[];
  /** Epoch ms. `to` takes in the whole of its day. */
  time?: { from?: number; to?: number };
  /** Only entries older than this; replaces `time` when both are given. */
  before?: number;
  /** The exact path. */
  url?: string;
  /** Text in the stored JSON. */
  query?: string;
  body?: string;
  params?: string;
  /** Newest first when left out. Entries equal on the property stay newest first. */
  sort?: { prop: ActivityLogSortProperty; asc: boolean };
  /** From 1. Without it, the first entries are returned. */
  page?: number;
  /** 15 when left out. */
  limit?: number;
};

type ActivityLogPage = {
  rows: ListedActivity[];
  /** How many entries match the filters. */
  totalRows: number;
  /** How many of them come after this page. */
  remainingRows: number;
  limit: number;
  page?: number;
};

/** What the screen and the CLI read from a tenant's activity log. */
interface ActivityLogQueryService {
  /** The tenant's latest entries, newest first. */
  recent(query: { limit: number }): Promise<ActivityLogSummary[]>;
  /** One page of the entries matching the filters, each described. */
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
