/** One request the API logged. The request's own details (body, query, params) are not part of it. */
type ActivityLogEntry = {
  method: string;
  url: string;
  /** null for a request made without a user. */
  username: string | null;
  /** Epoch ms. */
  time: number;
};

/** What the CLI reads from a tenant's activity log. */
interface ActivityLogQueryService {
  /** The tenant's latest entries, newest first. */
  recent(query: { limit: number }): Promise<ActivityLogEntry[]>;
}

export type { ActivityLogEntry, ActivityLogQueryService };
