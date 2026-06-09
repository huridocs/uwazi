// eslint-disable-next-line node/no-restricted-import
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { destroyKnexConnections } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';

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

/** Unique token so PG overrides are scoped to this test suite. */
const testPoolToken = Symbol('testing-pg-pool');
const testConfigToken = Symbol('testing-pg-config');

export type PGFixture = Record<string, Record<string, unknown>[]>;

const testingPG = {
  pool: null as pg.Pool | null,

  /** The name of the per-test database created by connect(). */
  dbName: '',

  get config(): {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  } {
    if (!this.dbName) throw new Error('testingPG not connected');
    return {
      host: config.postgres.host,
      port: config.postgres.port,
      database: this.dbName,
      user: config.postgres.user,
      password: config.postgres.password,
    };
  },

  /** Resolved tenant ID for the current test context. */
  currentTenantId(): string {
    try {
      return tenants.current().name;
    } catch {
      return 'default-tenant';
    }
  },

  async connect(): Promise<pg.Pool> {
    if (pool) return pool;

    this.dbName = `uwazi_test_${process.pid}_${uniqueID()}`.substring(0, 63);

    const admin = adminClient();
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${this.dbName}"`);
    } finally {
      await admin.end();
    }

    pool = new pg.Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: this.dbName,
      user: config.postgres.user,
      password: config.postgres.password,
    });

    this.pool = pool;

    PostgresConnectionFactory.registerPool(testPoolToken, pool);
    PostgresConnectionFactory.registerConfig(testConfigToken, this.config);

    await pool.query(THESAURUS_SQL);

    return pool;
  },

  async clear(tables: string[] = ['thesauri']): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    for (const table of tables) {
      await pool.query(`DELETE FROM "${table}"`);
    }
  },

  async setFixtures(fixtures: PGFixture): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    const tenantId = tenants.current().name;
    for (const [table, rows] of Object.entries(fixtures)) {
      await pool.query(`DELETE FROM "${table}"`);
      for (const row of rows) {
        const finalRow = 'tenant_id' in row ? row : { ...row, tenant_id: tenantId };
        const cols = Object.keys(finalRow)
          .map(c => `"${c}"`)
          .join(', ');
        const placeholders = Object.keys(finalRow)
          .map((_, i) => `$${i + 1}`)
          .join(', ');
        const values = Object.values(finalRow).map(v =>
          v !== null && typeof v === 'object' ? JSON.stringify(v) : v
        );
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
    await destroyKnexConnections();

    if (pool) {
      pool.on('error', () => {});
      await pool.end();
      pool = null;
      this.pool = null;
      PostgresConnectionFactory.unregisterPool(testPoolToken);
      PostgresConnectionFactory.unregisterConfig(testConfigToken);
    }

    if (this.dbName) {
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
