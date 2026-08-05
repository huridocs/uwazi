// eslint-disable-next-line node/no-restricted-import
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PgBlankState, TenantDataExistsError } from '../PgBlankState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PgBlankState', () => {
  let dataDir: string;
  let pool: any;

  const TENANT_A = 'tenant-a';
  const TENANT_B = 'tenant-b';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    pool = testingEnvironment.pg.pool;
    if (!pool) throw new Error('PG pool not available');

    dataDir = path.join(__dirname, `test-data-${Date.now()}`);
    mkdirSync(dataDir, { recursive: true });

    // Seed both tenants with data before each test
    await pool.query(
      `INSERT INTO templates ("_id", "name", "properties", "commonProperties", "default", "tenant_id")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['t1', 'Tenant A Template', '[]', '[]', false, TENANT_A]
    );
    await pool.query(
      `INSERT INTO templates ("_id", "name", "properties", "commonProperties", "default", "tenant_id")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['t2', 'Tenant B Template', '[]', '[]', false, TENANT_B]
    );
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    // Clean up tenant data
    if (pool) {
      await pool.query('DELETE FROM templates');
    }
  });

  const createFixture = (table: string, rows: Record<string, unknown>[]) => {
    writeFileSync(path.join(dataDir, `${table}.json`), JSON.stringify(rows));
  };

  describe('run', () => {
    it('should throw TenantDataExistsError when tenant data exists without force', async () => {
      createFixture('templates', [
        {
          _id: 'new1',
          name: 'New Template',
          properties: [],
          commonProperties: [],
          default: false,
          tenant_id: '__TENANT_ID__',
        },
      ]);

      const bs = new PgBlankState(pool, TENANT_A, dataDir);
      await expect(bs.run()).rejects.toThrow(TenantDataExistsError);
    });

    it('should delete and restore when force is true', async () => {
      createFixture('templates', [
        {
          _id: 'new1',
          name: 'Restored Template',
          properties: [],
          commonProperties: [],
          default: false,
          tenant_id: '__TENANT_ID__',
        },
      ]);

      const bs = new PgBlankState(pool, TENANT_A, dataDir);
      await bs.run({ force: true });

      const aResult = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [TENANT_A]);
      expect(aResult.rows).toHaveLength(1);
      expect(aResult.rows[0].name).toBe('Restored Template');

      const bResult = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [TENANT_B]);
      expect(bResult.rows).toHaveLength(1);
      expect(bResult.rows[0].name).toBe('Tenant B Template');
    });

    it('should restore fixtures on empty tenant without force', async () => {
      createFixture('templates', [
        {
          _id: 'new1',
          name: 'Fresh Template',
          properties: [],
          commonProperties: [],
          default: false,
          tenant_id: '__TENANT_ID__',
        },
      ]);

      const bs = new PgBlankState(pool, 'fresh-tenant', dataDir);
      await bs.run();

      const result = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [
        'fresh-tenant',
      ]);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Fresh Template');
    });

    it('should not affect pg_migrations table', async () => {
      const before = await pool.query('SELECT COUNT(*) as count FROM pg_migrations');
      const countBefore = parseInt(before.rows[0].count, 10);

      const bs = new PgBlankState(pool, TENANT_A, dataDir);
      await bs.run({ force: true });

      const after = await pool.query('SELECT COUNT(*) as count FROM pg_migrations');
      const countAfter = parseInt(after.rows[0].count, 10);

      expect(countAfter).toBe(countBefore);
    });

    it('should not affect other tenants', async () => {
      createFixture('templates', [
        {
          _id: 'new1',
          name: 'Only For A',
          properties: [],
          commonProperties: [],
          default: false,
          tenant_id: '__TENANT_ID__',
        },
      ]);

      const bs = new PgBlankState(pool, TENANT_A, dataDir);
      await bs.run({ force: true });

      const aResult = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [TENANT_A]);
      expect(aResult.rows).toHaveLength(1);
      expect(aResult.rows[0].name).toBe('Only For A');

      const bResult = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [TENANT_B]);
      expect(bResult.rows).toHaveLength(1);
      expect(bResult.rows[0].name).toBe('Tenant B Template');
    });

    it('should rollback delete if fixture restore fails, leaving tenant data intact', async () => {
      // Create a fixture that will FAIL during restore (bad column name)
      createFixture('templates', [
        {
          _id: 'new1',
          name: 'Restored Template',
          properties: [],
          commonProperties: [],
          default: false,
          nonexistent_column: 'this_will_fail', // column does not exist → INSERT fails
          tenant_id: '__TENANT_ID__',
        },
      ]);

      const bs = new PgBlankState(pool, TENANT_A, dataDir);
      await expect(bs.run({ force: true })).rejects.toThrow();

      const aResult = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [TENANT_A]);
      expect(aResult.rows).toHaveLength(1);
      expect(aResult.rows[0].name).toBe('Tenant A Template');
    });
  });
});
