import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '#api/config.js';
import uniqueID from '#shared/uniqueID.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { PgMigrator } from '../core/infrastructure/postgresql/PgMigrator.js';
import { serializePgValue } from '../core/infrastructure/postgresql/serializePgValue.js';

function escapeIdentifier(identifier: string): string {
  return identifier.replace(/"/g, '""');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../core/infrastructure/postgresql/schema_migrations');

/** Open a one-off admin client connected to the postgres maintenance DB. */
const adminClient = () =>
  new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.admin.user,
    password: config.postgres.admin.password,
  });

let pool: pg.Pool | null = null;

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
      user: config.postgres.admin.user,
      password: config.postgres.admin.password,
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
      await admin.query(`CREATE DATABASE "${escapeIdentifier(this.dbName)}"`);
    } finally {
      await admin.end();
    }

    pool = new pg.Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: this.dbName,
      user: config.postgres.admin.user,
      password: config.postgres.admin.password,
    });

    this.pool = pool;

    /**
     * Override PG config for this test process. Safe because Jest workers are
     * separate processes; the override is local to this process and reset in disconnect().
     */
    PostgresDB.setConfig(this.config);

    const migrator = new PgMigrator(MIGRATIONS_DIR, pool);
    await migrator.migrate();

    return pool;
  },

  async clear(tables: string[] = ['thesauri', 'templates', 'files']): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    for (const table of tables) {
      //eslint-disable-next-line no-await-in-loop
      await pool.query(`DELETE FROM "${escapeIdentifier(table)}"`);
    }
  },

  async setFixtures(fixtures: PGFixture): Promise<void> {
    if (!pool) throw new Error('testingPG not connected');
    const tenantId = tenants.current().name;
    for (const [table, rows] of Object.entries(fixtures)) {
      //eslint-disable-next-line no-await-in-loop
      await pool.query(`DELETE FROM "${escapeIdentifier(table)}"`);
      for (const row of rows) {
        const finalRow = 'tenant_id' in row ? row : { ...row, tenant_id: tenantId };
        const cols = Object.keys(finalRow)
          .map(c => `"${escapeIdentifier(c)}"`)
          .join(', ');
        const placeholders = Object.keys(finalRow)
          .map((_, i) => `$${i + 1}`)
          .join(', ');
        const values = Object.values(finalRow).map(v =>
          serializePgValue(v, v !== null && typeof v === 'object')
        );
        //eslint-disable-next-line no-await-in-loop
        await pool.query(
          `INSERT INTO "${escapeIdentifier(table)}" (${cols}) VALUES (${placeholders})`,
          values
        );
      }
    }
  },

  async getAllFrom<T extends pg.QueryResultRow = Record<string, any>>(table: string): Promise<T[]> {
    if (!pool) throw new Error('testingPG not connected');
    const result = await pool.query<T>(`SELECT * FROM "${escapeIdentifier(table)}"`);
    return result.rows;
  },

  async disconnect(): Promise<void> {
    await PostgresDB.disconnect();

    if (pool) {
      pool.on('error', () => {});
      await pool.end();
      pool = null;
      this.pool = null;
      PostgresDB.resetConfig();
    }

    if (this.dbName) {
      const admin = adminClient();
      await admin.connect();
      try {
        await admin.query(
          `DROP DATABASE IF EXISTS "${escapeIdentifier(this.dbName)}" WITH (FORCE)`
        );
      } finally {
        await admin.end();
      }
      this.dbName = '';
    }
  },
};

export { testingPG };
