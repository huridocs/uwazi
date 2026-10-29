// eslint-disable-next-line no-restricted-imports
import { createWriteStream, rmSync } from 'fs';
import { finished } from 'stream/promises';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { BlankStateEmptyError } from '#api/infrastructure/blank_state/BlankStateEmptyError.js';
import {
  clearBlankState,
  seedBlankState,
} from '#api/infrastructure/blank_state/specs/blankStateFixtures.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import { TenantAlreadyHasDataError } from '#api/infrastructure/tenant_backup/TenantAlreadyHasDataError.js';
import type { Tenant } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RestoreBlankStateController } from '../RestoreBlankStateController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_TENANT = 'source-tenant';
const TARGET_TENANT = 'target-tenant';

const tenantFor = (name: string, postgresCore = true): Tenant => ({
  name,
  dbName: '',
  indexName: '',
  uploadedDocuments: '',
  attachments: '',
  customUploads: '',
  activityLogs: '',
  domain: '',
  featureFlags: { postgresCore },
});

describe('RestoreBlankStateController', () => {
  let dumpFile: string;
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
    dumpFile = path.join(__dirname, `restore-ctrl-test-${Date.now()}.uwazidump`);
    await seedBlankState(pool, SOURCE_TENANT);

    const output = createWriteStream(dumpFile);
    await new PgTenantBackup(pool).export(SOURCE_TENANT, output);
    output.end();
    await finished(output);
  });

  afterEach(async () => {
    rmSync(dumpFile, { force: true });
    await clearBlankState(pool);
  });

  const restoreInto = async (
    tenantId: string,
    input: { force?: boolean } = {},
    reindex = jest.fn(async () => undefined)
  ) =>
    testingEnvironment.runWithContext(
      async () => RestoreBlankStateController.handle(input, { pool, dumpFile, reindex }),
      { tenant: tenantFor(tenantId) }
    );

  describe('handle', () => {
    it('should restore the dump into an empty tenant and reindex it', async () => {
      const reindex = jest.fn(async () => undefined);

      expect(await restoreInto(TARGET_TENANT, {}, reindex)).toEqual({ restored: true });

      const templates = await pool.query('SELECT name FROM templates WHERE tenant_id = $1', [
        TARGET_TENANT,
      ]);
      expect(templates.rows).toEqual([{ name: 'Document' }]);

      const users = await pool.query('SELECT username FROM users WHERE tenant_id = $1', [
        TARGET_TENANT,
      ]);
      expect(users.rows).toEqual([{ username: 'admin' }]);

      expect(reindex).toHaveBeenCalledWith(TARGET_TENANT);
    });

    it('should refuse a tenant that already has data', async () => {
      await seedBlankState(pool, TARGET_TENANT);

      await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(TenantAlreadyHasDataError);
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

    it('should reject when there is no dump file to restore', async () => {
      rmSync(dumpFile, { force: true });

      await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(BlankStateEmptyError);
    });
  });
});
