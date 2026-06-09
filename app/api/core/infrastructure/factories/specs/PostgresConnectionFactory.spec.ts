import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionFactory } from '../PostgresConnectionFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const adminClient = () =>
  new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.user,
    password: config.postgres.password,
  });

const TEST_TABLE_SQL = 'CREATE TABLE IF NOT EXISTS pcf_tenant (tenant TEXT)';
const DB_A = 'pcf_test_a_tenant';
const DB_B = 'pcf_test_b_tenant';

const connectPool = (db: string) =>
  new pg.Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: db,
    user: config.postgres.user,
    password: config.postgres.password,
  });

async function createDatabase(dbName: string): Promise<void> {
  const admin = adminClient();
  await admin.connect();
  await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  const setup = connectPool(dbName);
  await setup.query(TEST_TABLE_SQL);
  await setup.end();
}

async function dropDatabase(dbName: string): Promise<void> {
  const admin = adminClient();
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  await admin.end();
}

describe('PostgresConnectionFactory', () => {
  beforeAll(async () => {
    await createDatabase(DB_A);
    await createDatabase(DB_B);

    const seederA = connectPool(DB_A);
    await seederA.query("INSERT INTO pcf_tenant (tenant) VALUES ('tenant_a')");
    await seederA.end();

    const seederB = connectPool(DB_B);
    await seederB.query("INSERT INTO pcf_tenant (tenant) VALUES ('tenant_b')");
    await seederB.end();
  });

  afterAll(async () => {
    await PostgresConnectionFactory.close();
    await dropDatabase(DB_A);
    await dropDatabase(DB_B);
  });

  afterEach(() => {
    PostgresConnectionFactory.clearPool();
  });

  describe('explicit database routing', () => {
    it('connects to the correct database when given a name', async () => {
      const pool = PostgresConnectionFactory.default(DB_A);
      const result = await pool.query('SELECT tenant FROM pcf_tenant');
      expect(result.rows).toEqual([{ tenant: 'tenant_a' }]);
    });

    it('connects to a different database when given a different name', async () => {
      const pool = PostgresConnectionFactory.default(DB_B);
      const result = await pool.query('SELECT tenant FROM pcf_tenant');
      expect(result.rows).toEqual([{ tenant: 'tenant_b' }]);
    });
  });

  describe('pool caching', () => {
    it('reuses the same pool for the same database', async () => {
      const p1 = PostgresConnectionFactory.default(DB_A);
      const p2 = PostgresConnectionFactory.default(DB_A);
      expect(p1).toBe(p2);
    });

    it('returns different pools for different databases', async () => {
      const pA = PostgresConnectionFactory.default(DB_A);
      const pB = PostgresConnectionFactory.default(DB_B);
      expect(pA).not.toBe(pB);
    });
  });

  describe('usePool / clearPool', () => {
    it('usePool override bypasses explicit routing', async () => {
      const override = connectPool(DB_A);
      PostgresConnectionFactory.usePool(override);

      const pool = PostgresConnectionFactory.default(DB_B);
      expect(pool).toBe(override);

      await override.end();
      PostgresConnectionFactory.clearPool();
    });

    it('clearPool restores explicit routing', async () => {
      const override = connectPool(DB_A);
      PostgresConnectionFactory.usePool(override);
      PostgresConnectionFactory.clearPool();
      await override.end();

      const pool = PostgresConnectionFactory.default(DB_A);
      const result = await pool.query('SELECT tenant FROM pcf_tenant');
      expect(result.rows).toEqual([{ tenant: 'tenant_a' }]);
    });
  });

  describe('forDatabase', () => {
    it('creates independent pools per name', () => {
      const x = PostgresConnectionFactory.forDatabase(DB_A);
      const y = PostgresConnectionFactory.forDatabase(DB_B);
      expect(x).not.toBe(y);
    });
  });

  describe('connectionConfig', () => {
    it('returns config with explicit database name', () => {
      const cfg = PostgresConnectionFactory.connectionConfig(DB_A);
      expect(cfg.database).toBe(DB_A);
    });

    it('falls back to config default when no database is provided', () => {
      const cfg = PostgresConnectionFactory.connectionConfig();
      expect(cfg.database).toBe(config.postgres.database);
    });
  });
});
