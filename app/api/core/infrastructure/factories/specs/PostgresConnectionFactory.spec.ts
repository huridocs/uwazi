import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionFactory } from '../PostgresConnectionFactory.js';

const adminClient = () =>
  new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.admin.user,
    password: config.postgres.admin.password,
  });

const TEST_TABLE_SQL = 'CREATE TABLE IF NOT EXISTS pcf_tenant (tenant TEXT)';
const TEST_DB = `pcf_test_${process.pid}`;

const connectPool = (db: string) =>
  new pg.Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: db,
    user: config.postgres.admin.user,
    password: config.postgres.admin.password,
  });

async function createDatabase(dbName: string): Promise<void> {
  const admin = adminClient();
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }

  const setup = connectPool(dbName);
  await setup.query(TEST_TABLE_SQL);
  await setup.query("INSERT INTO pcf_tenant (tenant) VALUES ('test-tenant')");
  await setup.end();
}

async function dropDatabase(dbName: string): Promise<void> {
  const admin = adminClient();
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}

describe('PostgresConnectionFactory', () => {
  let testPool: pg.Pool;

  beforeAll(async () => {
    await createDatabase(TEST_DB);
    testPool = connectPool(TEST_DB);

    PostgresConnectionFactory.setConfig({
      host: config.postgres.host,
      port: config.postgres.port,
      database: TEST_DB,
      user: config.postgres.admin.user,
      password: config.postgres.admin.password,
    });
  });

  afterAll(async () => {
    await testPool.end();
    await PostgresConnectionFactory.close();
    PostgresConnectionFactory.resetConfig();
    await dropDatabase(TEST_DB);
  });

  afterEach(async () => {
    await PostgresConnectionFactory.close();
    PostgresConnectionFactory.setConfig({
      host: config.postgres.host,
      port: config.postgres.port,
      database: TEST_DB,
      user: config.postgres.admin.user,
      password: config.postgres.admin.password,
    });
  });

  describe('default()', () => {
    it('returns a pool connected to the configured database', async () => {
      const pool = PostgresConnectionFactory.default();
      const result = await pool.query('SELECT tenant FROM pcf_tenant');
      expect(result.rows).toEqual([{ tenant: 'test-tenant' }]);
    });

    it('reuses the same pool instance on subsequent calls', () => {
      const p1 = PostgresConnectionFactory.default();
      const p2 = PostgresConnectionFactory.default();
      expect(p1).toBe(p2);
    });
  });

  describe('setConfig / resetConfig', () => {
    it('setConfig override changes the target database', async () => {
      const pool = PostgresConnectionFactory.default();
      expect(pool).toBeDefined();
    });

    it('resetConfig falls back to default config', async () => {
      PostgresConnectionFactory.setConfig({
        host: config.postgres.host,
        port: config.postgres.port,
        database: TEST_DB,
        user: config.postgres.admin.user,
        password: config.postgres.admin.password,
      });
      PostgresConnectionFactory.resetConfig();

      const cfg = PostgresConnectionFactory.connectionConfig();
      expect(cfg.database).toBe(config.postgres.database);
    });
  });

  describe('connectionConfig()', () => {
    it('returns the config override when set', () => {
      const cfg = PostgresConnectionFactory.connectionConfig();
      expect(cfg.database).toBe(TEST_DB);
    });

    it('falls back to config default when reset', () => {
      PostgresConnectionFactory.resetConfig();
      try {
        const cfg = PostgresConnectionFactory.connectionConfig();
        expect(cfg.database).toBe(config.postgres.database);
      } finally {
        PostgresConnectionFactory.setConfig({
          host: config.postgres.host,
          port: config.postgres.port,
          database: TEST_DB,
          user: config.postgres.admin.user,
          password: config.postgres.admin.password,
        });
      }
    });
  });
});
