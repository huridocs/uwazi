import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionFactory } from '../PostgresConnectionFactory.js';

const adminClient = () =>
  new pg.Client({
    host: config.postgres.host,
    port: config.postgres.port,
    database: 'postgres',
    user: config.postgres.user,
    password: config.postgres.password,
  });

const TEST_TABLE_SQL = 'CREATE TABLE IF NOT EXISTS pcf_tenant (tenant TEXT)';
const TEST_DB = `pcf_test_${process.pid}`;

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
  const testConfigToken = Symbol('test-config');
  let testPool: pg.Pool;

  beforeAll(async () => {
    await createDatabase(TEST_DB);

    testPool = connectPool(TEST_DB);

    PostgresConnectionFactory.registerConfig(testConfigToken, {
      host: config.postgres.host,
      port: config.postgres.port,
      database: TEST_DB,
      user: config.postgres.user,
      password: config.postgres.password,
    });
  });

  afterAll(async () => {
    PostgresConnectionFactory.unregisterConfig(testConfigToken);
    await PostgresConnectionFactory.close();
    await testPool.end();
    await dropDatabase(TEST_DB);
  });

  afterEach(() => {
    PostgresConnectionFactory.clearPool();
  });

  describe('default()', () => {
    it('returns a pool connected to the configured database', async () => {
      PostgresConnectionFactory.usePool(testPool);
      const pool = PostgresConnectionFactory.default();
      const result = await pool.query('SELECT tenant FROM pcf_tenant');
      expect(result.rows).toEqual([{ tenant: 'test-tenant' }]);
    });

    it('reuses the same pool instance on subsequent calls', () => {
      PostgresConnectionFactory.usePool(testPool);
      const p1 = PostgresConnectionFactory.default();
      const p2 = PostgresConnectionFactory.default();
      expect(p1).toBe(p2);
    });
  });

  describe('usePool / clearPool', () => {
    it('usePool override bypasses the default pool', async () => {
      const override = connectPool(TEST_DB);
      PostgresConnectionFactory.usePool(override);

      const pool = PostgresConnectionFactory.default();
      expect(pool).toBe(override);

      await override.end();
    });

    it('clearPool restores default pool behavior', async () => {
      const override = connectPool(TEST_DB);
      PostgresConnectionFactory.usePool(override);
      PostgresConnectionFactory.clearPool();
      await override.end();

      const pool = PostgresConnectionFactory.default();
      expect(pool).toBeDefined();
      expect(pool).not.toBe(override);
    });
  });

  describe('connectionConfig()', () => {
    it('returns the config override when registered', () => {
      const cfg = PostgresConnectionFactory.connectionConfig();
      expect(cfg.database).toBe(TEST_DB);
    });

    it('falls back to config default when no override is registered', () => {
      PostgresConnectionFactory.unregisterConfig(testConfigToken);
      try {
        const cfg = PostgresConnectionFactory.connectionConfig();
        expect(cfg.database).toBe(config.postgres.database);
      } finally {
        PostgresConnectionFactory.registerConfig(testConfigToken, {
          host: config.postgres.host,
          port: config.postgres.port,
          database: TEST_DB,
          user: config.postgres.user,
          password: config.postgres.password,
        });
      }
    });
  });
});
