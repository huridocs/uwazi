import pg from 'pg';
import { config } from '#api/config.js';

let pool: pg.Pool | undefined;

export class PostgresConnectionFactory {
  static default(): pg.Pool {
    if (!pool) {
      pool = new pg.Pool({
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
      });
    }
    return pool;
  }

  /** For tests: create a pool pointing at a specific database. */
  static forDatabase(database: string): pg.Pool {
    return new pg.Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database,
      user: config.postgres.user,
      password: config.postgres.password,
    });
  }

  /** Close the default pool — call in teardown. */
  static async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = undefined;
    }
  }
}
