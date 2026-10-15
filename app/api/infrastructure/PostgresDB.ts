import knex, { Knex } from 'knex';
import pg from 'pg';
import { config } from '#api/config.js';

/**
 * Defaults for every connection handed to a migration: one that collides with live traffic fails
 * fast instead of stalling it. A migration that needs longer overrides them with SET LOCAL.
 */
const MIGRATION_TIMEOUTS = { lockTimeout: '10s', statementTimeout: '5min' };

type PgConnection = { query: (sql: string, callback: (error: Error | null) => void) => void };

export type PostgresConnectionConfig = {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
};

export class PostgresDB {
  private static _knex: Knex | null = null;

  private static _adminKnex: Knex | null = null;

  private static _pool: pg.Pool | null = null;

  private static _adminPool: pg.Pool | null = null;

  private static _activeConfig: PostgresConnectionConfig | null = null;

  private static connect(): Knex {
    if (this._knex) return this._knex;

    const connection = this._activeConfig ?? {
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.app?.user,
      password: config.postgres.app?.password,
    };

    pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);

    this._knex = knex({
      client: 'pg',
      connection,
      useNullAsDefault: true,
    });

    return this._knex;
  }

  static async disconnect(): Promise<void> {
    await Promise.all([
      this._knex?.destroy(),
      this._pool?.end(),
      this._adminPool?.end(),
      this._adminKnex?.destroy(),
    ]);
    this._knex = null;
    this._pool = null;
    this._adminPool = null;
    this._adminKnex = null;
  }

  static get knex(): Knex {
    if (!this._knex) {
      return this.connect();
    }
    return this._knex;
  }

  static pool(): pg.Pool {
    if (!this._pool) {
      this._pool = new pg.Pool(
        this._activeConfig ?? {
          host: config.postgres.host,
          port: config.postgres.port,
          database: config.postgres.database,
          user: config.postgres.app?.user,
          password: config.postgres.app?.password,
        }
      );
    }
    return this._pool;
  }

  private static adminConnectionConfig(): PostgresConnectionConfig {
    return (
      this._activeConfig ?? {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.admin?.user,
        password: config.postgres.admin?.password,
      }
    );
  }

  static adminPool(): pg.Pool {
    if (!this._adminPool) {
      this._adminPool = new pg.Pool(this.adminConnectionConfig());
    }

    return this._adminPool;
  }

  /** Admin credentials, with migration timeouts set on every connection. For migrations only. */
  static adminKnex(): Knex {
    if (!this._adminKnex) {
      this._adminKnex = knex({
        client: 'pg',
        connection: this.adminConnectionConfig(),
        useNullAsDefault: true,
        pool: {
          afterCreate: (
            connection: PgConnection,
            done: (error: Error | null, connection: PgConnection) => void
          ) => {
            connection.query(
              `SET lock_timeout = '${MIGRATION_TIMEOUTS.lockTimeout}'; SET statement_timeout = '${MIGRATION_TIMEOUTS.statementTimeout}'`,
              error => done(error, connection)
            );
          },
        },
      });
    }

    return this._adminKnex;
  }

  static setConfig(cfg: PostgresConnectionConfig): void {
    this._activeConfig = cfg;
    this._knex = null;
    this._pool = null;
    this._adminPool = null;
    this._adminKnex = null;
  }

  static resetConfig(): void {
    this._activeConfig = null;
    this._knex = null;
    this._pool = null;
    this._adminPool = null;
    this._adminKnex = null;
  }

  static connectionConfig(): PostgresConnectionConfig {
    return (
      this._activeConfig ?? {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.app?.user,
        password: config.postgres.app?.password,
      }
    );
  }
}
