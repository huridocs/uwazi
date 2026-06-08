import pg from 'pg';
import { config } from '#api/config.js';
import { tenants } from '#api/tenants/tenantContext.js';

const pools = new Map<string, pg.Pool>();

/**
 * Scoped pool overrides keyed by unique symbols.
 * Each test suite creates its own symbol to isolate pool overrides.
 * In production this map remains empty.
 */
const poolOverrides = new Map<symbol, pg.Pool>();

const defaultToken = Symbol('default-pool-override');

export class PostgresConnectionFactory {
  static default(): pg.Pool {
    // Return the most recently registered override (for testing).
    // In practice, at most one test pool is active at a time.
    if (poolOverrides.size > 0) {
      return Array.from(poolOverrides.values()).pop()!;
    }

    let database = config.postgres.database;
    try {
      database = tenants.current().dbName;
    } catch {
      // no async context — use config default
    }

    return this.forDatabase(database);
  }

  static forDatabase(database: string): pg.Pool {
    if (!pools.has(database)) {
      pools.set(
        database,
        new pg.Pool({
          host: config.postgres.host,
          port: config.postgres.port,
          database,
          user: config.postgres.user,
          password: config.postgres.password,
        })
      );
    }
    return pools.get(database)!;
  }

  static async close(): Promise<void> {
    for (const pool of pools.values()) {
      //eslint-disable-next-line no-await-in-loop
      await pool.end();
    }
    pools.clear();
  }

  /**
   * Register a scoped pool override identified by a unique symbol.
   * Each test suite should create its own symbol for isolation:
   *
   *   const token = Symbol('my-suite');
   *   PostgresConnectionFactory.registerPool(token, myPool);
   *
   * Call unregisterPool(token) in afterEach/afterAll to clean up.
   */
  static registerPool(token: symbol, pool: pg.Pool): void {
    poolOverrides.set(token, pool);
  }

  static unregisterPool(token: symbol): void {
    poolOverrides.delete(token);
  }

  /**
   * Register a pool override under the default token.
   * Prefer registerPool/unregisterPool with a unique symbol for better isolation.
   */
  static usePool(pool: pg.Pool): void {
    poolOverrides.set(defaultToken, pool);
  }

  static clearPool(): void {
    poolOverrides.delete(defaultToken);
  }
}
