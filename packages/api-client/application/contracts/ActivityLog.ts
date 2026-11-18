import type { ActivityLogResponse } from '#activitylog';
import type { ActivityLogGetRequest } from '#shared/types/activityLogApiTypes.js';

/** GET /api/activitylog (admins only) — pass typed values; over HTTP they arrive JSON-encoded. */
type ActivityLogQuery = NonNullable<ActivityLogGetRequest['query']>;

export type { ActivityLogQuery, ActivityLogResponse };
