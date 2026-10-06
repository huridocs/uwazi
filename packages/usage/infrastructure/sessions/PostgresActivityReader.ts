import type { Pool } from 'pg';
import type { ActivityReader } from '../../application/contracts/ActivityReader.js';

/**
 * connect-pg-simple sessions. The table has no tenant column, so the tenant is read from
 * passport's `<userId>///<tenant>`. Touching a session moves `expire` a full TTL ahead, so the
 * last activity is `expire - TTL`.
 */
class PostgresActivityReader implements ActivityReader {
  constructor(private readonly deps: { pool: Pool; ttlSeconds: number }) {}

  async lastSession(tenantName: string): Promise<number | null> {
    const result = await this.deps.pool.query<{ last_active: Date | null }>(
      `SELECT max(expire) - make_interval(secs => $2) AS last_active
         FROM http_sessions
        WHERE split_part(sess -> 'passport' ->> 'user', '///', 2) = $1`,
      [tenantName, this.deps.ttlSeconds]
    );

    const lastActive = result.rows[0]?.last_active;
    return lastActive ? lastActive.getTime() : null;
  }
}

export { PostgresActivityReader };
