import knex, { Knex } from 'knex';
import pg from 'pg';
import { config } from '#api/config.js';

export type PostgresConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

let _knex: Knex | null = null;
let _pool: pg.Pool | null = null;
let _activeConfig: PostgresConnectionConfig | null = null;

export const PostgresDB = {
  connect(cfg?: PostgresConnectionConfig): Knex {
    if (_knex) return _knex;

    const connection = cfg ?? _activeConfig ?? config.postgres;

    pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);

    _knex = knex({
      client: 'pg',
      connection,
      useNullAsDefault: true,
    });

    return _knex;
  },

  async disconnect(): Promise<void> {
    if (_knex) {
      await _knex.destroy();
      _knex = null;
    }
    if (_pool) {
      await _pool.end();
      _pool = null;
    }
  },

  get knex(): Knex {
    if (!_knex) {
      return this.connect();
    }
    return _knex;
  },

  pool(): pg.Pool {
    if (!_pool) {
      _pool = new pg.Pool(_activeConfig ?? config.postgres);
    }
    return _pool;
  },

  setConfig(cfg: PostgresConnectionConfig): void {
    _activeConfig = cfg;
    _knex = null;
    _pool = null;
  },

  resetConfig(): void {
    _activeConfig = null;
    _knex = null;
    _pool = null;
  },

  connectionConfig(): PostgresConnectionConfig {
    return (
      _activeConfig ?? {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
      }
    );
  },
};
