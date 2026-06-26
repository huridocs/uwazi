import pg from 'pg';
import { PostgresDB, PostgresConnectionConfig } from '#api/infrastructure/PostgresDB.js';

/**
 * @deprecated Use PostgresDB from '#api/infrastructure/PostgresDB.js' instead.
 * Kept for backwards compatibility with existing callers.
 */
export class PostgresConnectionFactory {
  static setConfig(cfg: PostgresConnectionConfig): void {
    PostgresDB.setConfig(cfg);
  }

  static resetConfig(): void {
    PostgresDB.resetConfig();
  }

  static default(): pg.Pool {
    return PostgresDB.pool();
  }

  static connectionConfig(): PostgresConnectionConfig {
    return PostgresDB.connectionConfig();
  }

  static async close(): Promise<void> {
    await PostgresDB.disconnect();
  }
}

export type { PostgresConnectionConfig };
