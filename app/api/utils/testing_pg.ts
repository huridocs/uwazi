// eslint-disable-next-line node/no-restricted-import
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENTITY_SQL = readFileSync(
  path.join(__dirname, '../core/infrastructure/postgresql/schema/entity.sql'),
  'utf-8'
);

/** Open a one-off admin client connected to the postgres maintenance DB. */
const adminClient = () =>
  new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.user,
    password: config.postgres.password,
  });

let pool: pg.Pool | null = null;

const testingPG = {
  pool: null as pg.Pool | null,

  /** The name of the per-test database created by connect(). */
  dbName: '',

  async connect(): Promise<pg.Pool> {
    if (pool) return pool;

    // Generate a unique DB name (PG identifiers are limited to 63 chars).
    this.dbName = `uwazi_test_${process.pid}_${uniqueID()}`.substring(0, 63);

    // Create the database via an admin connection to the maintenance DB.
    const admin = adminClient();
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${this.dbName}"`);
    } finally {
      await admin.end();
    }

    // Connect to the freshly created database and apply DDL.
    pool = new pg.Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: this.dbName,
      user: config.postgres.user,
      password: config.postgres.password,
    });

    this.pool = pool;

    await pool.query(ENTITY_SQL);

    return pool;
  },

  async clear(tables: string[] = ['entities']): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    for (const table of tables) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(`DELETE FROM ${table}`);
    }
  },

  async getAllFrom<T extends pg.QueryResultRow = Record<string, unknown>>(
    table: string
  ): Promise<T[]> {
    if (!pool) throw new Error('testingPG not connected');
    const result = await pool.query<T>(`SELECT * FROM ${table}`);
    return result.rows;
  },

  async disconnect(): Promise<void> {
    if (pool) {
      // Suppress idle-client errors that pg-pool emits when the database is
      // dropped while connections are still in the pool.
      pool.on('error', () => {});
      await pool.end();
      pool = null;
      this.pool = null;
    }

    if (this.dbName) {
      // Drop the per-test database; WITH (FORCE) terminates any lingering connections.
      const admin = adminClient();
      await admin.connect();
      try {
        await admin.query(`DROP DATABASE IF EXISTS "${this.dbName}" WITH (FORCE)`);
      } finally {
        await admin.end();
      }
      this.dbName = '';
    }
  },
};

export { testingPG };
