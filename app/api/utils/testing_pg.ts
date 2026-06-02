// eslint-disable-next-line node/no-restricted-import
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THESAURUS_SQL = readFileSync(
  path.join(__dirname, '../core/infrastructure/postgresql/schema/thesaurus.sql'),
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

export type PGFixture = Record<string, Record<string, unknown>[]>;

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

    // Register the test pool with the factory so all datasources transparently use it.
    PostgresConnectionFactory.usePool(pool);

    await pool.query(THESAURUS_SQL);

    return pool;
  },

  async clear(tables: string[] = ['thesauri']): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    for (const table of tables) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(`DELETE FROM "${table}"`);
    }
  },

  async setFixtures(fixtures: PGFixture): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    for (const [table, rows] of Object.entries(fixtures)) {
      // eslint-disable-next-line no-await-in-loop
      await pool.query(`DELETE FROM "${table}"`);
      for (const row of rows) {
        const cols = Object.keys(row)
          .map(c => `"${c}"`)
          .join(', ');
        const placeholders = Object.keys(row)
          .map((_, i) => `$${i + 1}`)
          .join(', ');
        const values = Object.values(row).map(v =>
          v !== null && typeof v === 'object' ? JSON.stringify(v) : v
        );
        // eslint-disable-next-line no-await-in-loop
        await pool.query(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, values);
      }
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
      // Clear the factory's reference so it doesn't hold a dead pool.
      PostgresConnectionFactory.clearPool();
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
