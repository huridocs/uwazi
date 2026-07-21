import knex, { Knex } from 'knex';
import pg from 'pg';
import { config } from '#api/config.js';

export type PostgresConnectionConfig = {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
};

export class PostgresDB {
  private static _knex: Knex | null = null;

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
    if (this._knex) {
      await this._knex.destroy();
      this._knex = null;
    }
    if (this._pool) {
      await this._pool.end();
      this._pool = null;
    }
    if (this._adminPool) {
      await this._adminPool.end();
      this._adminPool = null;
    }
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

  static adminPool(): pg.Pool {
    if (!this._adminPool) {
      this._adminPool = new pg.Pool(
        this._activeConfig ?? {
          host: config.postgres.host,
          port: config.postgres.port,
          database: config.postgres.database,
          user: config.postgres.admin?.user,
          password: config.postgres.admin?.password,
        }
      );
    }

    return this._adminPool;
  }

  static setConfig(cfg: PostgresConnectionConfig): void {
    this._activeConfig = cfg;
    this._knex = null;
    this._pool = null;
    this._adminPool = null;
  }

  static resetConfig(): void {
    this._activeConfig = null;
    this._knex = null;
    this._pool = null;
    this._adminPool = null;
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
