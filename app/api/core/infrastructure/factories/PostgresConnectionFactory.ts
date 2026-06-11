import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionConfig } from '../postgresql/common/PostgresTable.js';

let defaultPool: pg.Pool | null = null;

let activeConfig: PostgresConnectionConfig | null = null;

export class PostgresConnectionFactory {
  static setConfig(cfg: PostgresConnectionConfig): void {
    activeConfig = cfg;
    defaultPool = null; // force re-creation with new config
  }

  static resetConfig(): void {
    activeConfig = null;
  }

  static default(): pg.Pool {
    const cfg = activeConfig ?? config.postgres;

    if (!defaultPool) {
      defaultPool = new pg.Pool(cfg);
    }

    return defaultPool;
  }

  static connectionConfig(): PostgresConnectionConfig {
    return (
      activeConfig ?? {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
      }
    );
  }

  static async close(): Promise<void> {
    if (defaultPool) {
      await defaultPool.end();
      defaultPool = null;
    }
  }
}
