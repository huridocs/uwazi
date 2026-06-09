import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionConfig } from '../postgresql/common/PostgresTable.js';

const pools = new Map<string, pg.Pool>();

const poolOverrides = new Map<symbol, pg.Pool>();

const configOverrides = new Map<symbol, PostgresConnectionConfig>();

const defaultToken = Symbol('default-pool-override');

export class PostgresConnectionFactory {
  static default(database?: string): pg.Pool {
    if (poolOverrides.size > 0) {
      return Array.from(poolOverrides.values()).pop()!;
    }

    return this.forDatabase(database ?? config.postgres.database);
  }

  static connectionConfig(database?: string): PostgresConnectionConfig {
    if (configOverrides.size > 0) {
      return Array.from(configOverrides.values()).pop()!;
    }

    return {
      host: config.postgres.host,
      port: config.postgres.port,
      database: database ?? config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    };
  }

  static registerConfig(token: symbol, cfg: PostgresConnectionConfig): void {
    configOverrides.set(token, cfg);
  }

  static unregisterConfig(token: symbol): void {
    configOverrides.delete(token);
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

  static registerPool(token: symbol, pool: pg.Pool): void {
    poolOverrides.set(token, pool);
  }

  static unregisterPool(token: symbol): void {
    poolOverrides.delete(token);
  }

  static usePool(pool: pg.Pool): void {
    poolOverrides.set(defaultToken, pool);
  }

  static clearPool(): void {
    poolOverrides.delete(defaultToken);
  }
}
