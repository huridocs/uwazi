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

  /**
   * Override the default pool with an externally managed one.
   * Intended for use in tests only — testingPG calls this after creating
   * the per-test database so that all datasources transparently use it.
   */
  static usePool(override: pg.Pool): void {
    pool = override;
  }

  /**
   * Clear the pool reference without ending it.
   * Used by testingPG after it has already ended the pool itself.
   */
  static clearPool(): void {
    pool = undefined;
  }
}
