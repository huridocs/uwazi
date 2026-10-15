// eslint-disable-next-line no-restricted-imports
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { BlankStateEmptyError } from '#api/infrastructure/blank_state/BlankStateEmptyError.js';
import { BlankStateTablesMissingError } from '#api/infrastructure/blank_state/BlankStateTablesMissingError.js';
import { PgBlankState } from '#api/infrastructure/blank_state/PgBlankState.js';
import { TenantDataExistsError } from '#api/infrastructure/blank_state/TenantDataExistsError.js';
import {
  clearBlankState,
  seedBlankState,
} from '#api/infrastructure/blank_state/specs/blankStateFixtures.js';
import type { Tenant } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RestoreBlankStateController } from '../RestoreBlankStateController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_TENANT = 'source-tenant';
const TARGET_TENANT = 'target-tenant';

const tenantFor = (name: string): Tenant => ({
  name,
  dbName: '',
  indexName: '',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  domain: '',
});

describe('RestoreBlankStateController', () => {
  let dataDir: string;
  let pool: Pool;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    const testPool = testingEnvironment.pg.pool;
    if (!testPool) throw new Error('PG pool not available');
    pool = testPool;
    dataDir = path.join(__dirname, `restore-ctrl-test-${Date.now()}`);
    mkdirSync(dataDir, { recursive: true });
    await seedBlankState(pool, SOURCE_TENANT);
    await new PgBlankState(pool, SOURCE_TENANT, dataDir).dump();
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    await clearBlankState(pool);
  });

  const restoreInto = async (tenantId: string, input: { force?: boolean } = {}) =>
    testingEnvironment.runWithContext(
      async () => RestoreBlankStateController.handle(input, { pool, dataDir }),
      { tenant: tenantFor(tenantId) }
    );

  describe('handle', () => {
    it('should restore fixtures into an empty tenant', async () => {
      expect(await restoreInto(TARGET_TENANT)).toEqual({ restored: true });

      const templates = await pool.query('SELECT name FROM templates WHERE tenant_id = $1', [
        TARGET_TENANT,
      ]);
      expect(templates.rows).toEqual([{ name: 'Document' }]);

      const users = await pool.query('SELECT username FROM users WHERE tenant_id = $1', [
        TARGET_TENANT,
      ]);
      expect(users.rows).toEqual([{ username: 'admin' }]);
    });

    it('should refuse a tenant that already has data', async () => {
      await seedBlankState(pool, TARGET_TENANT);

      await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(TenantDataExistsError);
    });

    it('should replace the tenant data when forced', async () => {
      await seedBlankState(pool, TARGET_TENANT, { siteName: 'Old Site' });

      await expect(restoreInto(TARGET_TENANT, { force: true })).resolves.toEqual({
        restored: true,
      });

      const settings = await pool.query('SELECT site_name FROM settings WHERE tenant_id = $1', [
        TARGET_TENANT,
      ]);
      expect(settings.rows).toEqual([{ site_name: 'Uwazi' }]);
    });

    it('should reject when there are no fixtures to restore', async () => {
      rmSync(dataDir, { recursive: true, force: true });
      mkdirSync(dataDir, { recursive: true });

      await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(BlankStateEmptyError);
    });

    it('should reject when a fixture targets a missing table', async () => {
      writeFileSync(path.join(dataDir, 'no_such_table.json'), JSON.stringify([{ _id: 'x' }]));

      await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(BlankStateTablesMissingError);
    });
  });
});
