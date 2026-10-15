/** An `activitylogs` row. Null columns are absent: `PostgresTable` strips them on read. */
type PostgresActivityLogRow = {
  _id: string;
  method: string;
  url: string;
  params?: string;
  query?: string;
  body?: string;
  user_id?: string;
  username?: string;
  /** BIGINT, which `pg` returns as a string. */
  time: number | string;
};

export type { PostgresActivityLogRow };
