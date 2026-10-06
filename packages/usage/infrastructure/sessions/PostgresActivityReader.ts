import type { Pool } from 'pg';
import type { ActivityReader } from '../../application/contracts/ActivityReader.js';

/**
 * connect-pg-simple sessions. The table has no tenant column, so the tenant is read from
 * passport's `<userId>///<tenant>`. Touching a session moves `expire` a full TTL ahead, so the
 * last activity is `expire - TTL`.
 *
 * `expire` has no time zone: the store writes it with to_timestamp(), in the server's time zone.
 * The epoch is computed here, in that same zone, because the driver would read the value in the
 * Node process's zone instead.
 */
class PostgresActivityReader implements ActivityReader {
  constructor(private readonly deps: { pool: Pool; ttlSeconds: number }) {}

  async lastSession(tenantName: string): Promise<number | null> {
    const result = await this.deps.pool.query<{ last_active_ms: string | number | null }>(
      `SELECT (extract(epoch FROM max(expire) AT TIME ZONE current_setting('TimeZone')) * 1000
               - $2::bigint * 1000)::bigint AS last_active_ms
         FROM http_sessions
        WHERE split_part(sess -> 'passport' ->> 'user', '///', 2) = $1`,
      [tenantName, this.deps.ttlSeconds]
    );

    const lastActiveMs = result.rows[0]?.last_active_ms;
    return lastActiveMs === null || lastActiveMs === undefined ? null : Number(lastActiveMs);
  }
}

export { PostgresActivityReader };
