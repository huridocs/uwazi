import type { ActivityDescription } from '../query/ActivityDescription.js';

/** One entry as the activity log screen reads it. Fields the entry lacks are left out. */
type ActivityLogResponseRow = {
  _id: string;
  method: string;
  url: string;
  params?: string;
  query?: string;
  body?: string;
  user?: string;
  username?: string;
  time: number;
  semantic: ActivityDescription;
};

/** What `GET /api/activitylog` answers. */
type ActivityLogResponse = {
  rows: ActivityLogResponseRow[];
  remainingRows: number;
  limit: number;
  page?: number;
  totalRows: number;
};

export type { ActivityLogResponse, ActivityLogResponseRow };
