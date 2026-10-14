// eslint-disable-next-line no-restricted-imports
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import {
  PgBlankState,
  TenantDataExistsError,
} from '#api/infrastructure/blank_state/PgBlankState.js';
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

async function seed(pool: Pool, tenantId: string, siteName = 'Uwazi'): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');

  await pool.query(
    `INSERT INTO templates ("_id","name","properties","commonProperties","color","default","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      'tpl-doc',
      'Document',
      '[{"name":"title","type":"text"}]',
      '[{"name":"title","label":"Title"}]',
      '#c03b22',
      true,
      tenantId,
    ]
  );
  await pool.query(
    `INSERT INTO settings ("tenant_id","_id","site_name","languages","private","new_name_generation")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, `${tenantId}-settings`, siteName, '[{"key":"en","default":true}]', true, true]
  );
  await pool.query(
    `INSERT INTO users ("_id","tenant_id","username","password","email","role")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [`${tenantId}-admin`, tenantId, 'admin', 'secret', 'admin@uwazi.local', 'admin']
  );
  await pool.query(
    `INSERT INTO translations ("_id","language","key","value","context_id","context_type","context_label","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [`${tenantId}-tr`, 'en', 'Document', 'Document', 'tpl-doc', 'Entity', 'Document', tenantId]
  );
}

async function clear(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');
}

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
    await seed(pool, SOURCE_TENANT);
    await new PgBlankState(pool, SOURCE_TENANT, dataDir).dump();
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    await clear(pool);
  });

  const restoreInto = async (tenantId: string, input: { force?: boolean } = {}) =>
    testingEnvironment.runWithContext(
      async () => RestoreBlankStateController.handle(input, { pool, dataDir }),
      { tenant: tenantFor(tenantId) }
    );

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
    await seed(pool, TARGET_TENANT);

    await expect(restoreInto(TARGET_TENANT)).rejects.toBeInstanceOf(TenantDataExistsError);
  });

  it('should replace the tenant data when forced', async () => {
    await seed(pool, TARGET_TENANT, 'Old Site');

    await expect(restoreInto(TARGET_TENANT, { force: true })).resolves.toEqual({ restored: true });

    const settings = await pool.query('SELECT site_name FROM settings WHERE tenant_id = $1', [
      TARGET_TENANT,
    ]);
    expect(settings.rows).toEqual([{ site_name: 'Uwazi' }]);
  });
});
