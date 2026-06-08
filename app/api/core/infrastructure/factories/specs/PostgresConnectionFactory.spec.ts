import pg from 'pg';
import { config } from '#api/config.js';
import { PostgresConnectionFactory } from '../PostgresConnectionFactory.js';
import { testingTenants } from '#api/utils/testingTenants.js';
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

const tenantA = {
  name: 'tenant_a',
  dbName: DB_A,
  indexName: 'index_a',
  domain: '127.0.0.1',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  featureFlags: {},
};

const tenantB = {
  name: 'tenant_b',
  dbName: DB_B,
  indexName: 'index_b',
  domain: '127.0.0.1',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  featureFlags: {},
};

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
    testingTenants.restoreCurrentFn();
  });

  afterEach(() => {
    PostgresConnectionFactory.clearPool();
  });

  describe('tenant-aware routing', () => {
    it('routes to the correct tenant database', async () => {
      testingTenants.mockCurrentTenant(tenantA);

      await testingEnvironment.runWithContext(
        async () => {
          const pool = PostgresConnectionFactory.default();
          const result = await pool.query('SELECT tenant FROM pcf_tenant');
          expect(result.rows).toEqual([{ tenant: 'tenant_a' }]);
        },
        { tenant: tenantA }
      );
    });

    it('routes to a different tenant database', async () => {
      testingTenants.mockCurrentTenant(tenantB);

      await testingEnvironment.runWithContext(
        async () => {
          const pool = PostgresConnectionFactory.default();
          const result = await pool.query('SELECT tenant FROM pcf_tenant');
          expect(result.rows).toEqual([{ tenant: 'tenant_b' }]);
        },
        { tenant: tenantB }
      );
    });
  });

  describe('pool caching', () => {
    it('reuses the same pool for the same tenant', async () => {
      testingTenants.mockCurrentTenant(tenantA);

      await testingEnvironment.runWithContext(
        async () => {
          const p1 = PostgresConnectionFactory.default();
          const p2 = PostgresConnectionFactory.default();
          expect(p1).toBe(p2);
        },
        { tenant: tenantA }
      );
    });

    it('returns different pools for different tenants', async () => {
      testingTenants.mockCurrentTenant(tenantA);

      let pA!: pg.Pool;
      await testingEnvironment.runWithContext(
        async () => {
          pA = PostgresConnectionFactory.default();
        },
        { tenant: tenantA }
      );

      testingTenants.mockCurrentTenant(tenantB);

      let pB!: pg.Pool;
      await testingEnvironment.runWithContext(
        async () => {
          pB = PostgresConnectionFactory.default();
        },
        { tenant: tenantB }
      );

      expect(pA).not.toBe(pB);
    });
  });

  describe('usePool / clearPool', () => {
    it('usePool override bypasses tenant routing', async () => {
      testingTenants.mockCurrentTenant(tenantA);
      const override = connectPool(DB_A);
      PostgresConnectionFactory.usePool(override);

      await testingEnvironment.runWithContext(
        async () => {
          const pool = PostgresConnectionFactory.default();
          expect(pool).toBe(override);
        },
        { tenant: tenantA }
      );

      await override.end();
      PostgresConnectionFactory.clearPool();
    });

    it('clearPool restores tenant routing', async () => {
      testingTenants.mockCurrentTenant(tenantA);
      const override = connectPool(DB_A);
      PostgresConnectionFactory.usePool(override);
      PostgresConnectionFactory.clearPool();
      await override.end();

      await testingEnvironment.runWithContext(
        async () => {
          const pool = PostgresConnectionFactory.default();
          const result = await pool.query('SELECT tenant FROM pcf_tenant');
          expect(result.rows).toEqual([{ tenant: 'tenant_a' }]);
        },
        { tenant: tenantA }
      );
    });
  });

  describe('forDatabase', () => {
    it('creates independent pools per name', () => {
      const x = PostgresConnectionFactory.forDatabase(DB_A);
      const y = PostgresConnectionFactory.forDatabase(DB_B);
      expect(x).not.toBe(y);
    });
  });
});
