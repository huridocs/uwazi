import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionConfig } from '../postgresql/common/PostgresTable.js';

let defaultPool: pg.Pool | null = null;

const poolOverrides = new Map<symbol, pg.Pool>();

const configOverrides = new Map<symbol, PostgresConnectionConfig>();

const defaultToken = Symbol('default-pool-override');

export class PostgresConnectionFactory {
  static default(): pg.Pool {
    if (poolOverrides.size > 0) {
      return Array.from(poolOverrides.values()).pop()!;
    }

    if (!defaultPool) {
      defaultPool = new pg.Pool({
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
      });
    }

    return defaultPool;
  }

  static connectionConfig(): PostgresConnectionConfig {
    if (configOverrides.size > 0) {
      return Array.from(configOverrides.values()).pop()!;
    }

    return {
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
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

  static async close(): Promise<void> {
    if (defaultPool) {
      await defaultPool.end();
      defaultPool = null;
    }
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
