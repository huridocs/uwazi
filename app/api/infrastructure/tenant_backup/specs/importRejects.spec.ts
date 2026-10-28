import { Readable } from 'stream';
import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PgTenantBackup } from '../PgTenantBackup.js';
import { TenantAlreadyHasDataError } from '../TenantAlreadyHasDataError.js';
import { discoverDataTablesWithColumns } from '../tenantTableDiscovery.js';
import {
  backupAtVersion,
  clearTables,
  exportTenant,
  seedSource,
  SOURCE_TENANT,
  TARGET_TENANT,
} from './helpers.js';

describe('PgTenantBackup import rejections', () => {
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
    await clearTables(pool);
  });

  afterEach(async () => {
    await clearTables(pool);
  });

  it('rejects importing into a tenant that already has data', async () => {
    await seedSource(pool, SOURCE_TENANT);
    await seedSource(pool, TARGET_TENANT);
    const { text } = await exportTenant(pool, SOURCE_TENANT);

    await expect(
      new PgTenantBackup(pool).import(TARGET_TENANT, Readable.from([text]))
    ).rejects.toBeInstanceOf(TenantAlreadyHasDataError);

    const target = await pool.query('SELECT name FROM templates WHERE "tenant_id" = $1', [
      TARGET_TENANT,
    ]);
    expect(target.rows).toEqual([{ name: 'Document' }]);
  });

  it('surfaces the Postgres error, not a TypeError, when a COPY fails mid-stream', async () => {
    const templates = (await discoverDataTablesWithColumns(pool)).find(
      t => t.name === 'templates'
    )!;
    // A row one field short makes COPY fail, but the manifest still validates.
    const malformed = templates.columns
      .slice(0, -1)
      .map((_column, index) => (index === 0 ? SOURCE_TENANT : 'x'))
      .join('\t');
    // Padding rows keep the write loop running after the server aborts the COPY, which is where
    // the old code dereferenced the nulled connection.
    const rows = [malformed, ...Array.from({ length: 40000 }, () => 'x'.repeat(64))];
    const body = `${rows.join('\n')}\n\\.\n`;
    const manifest = `${JSON.stringify({
      version: 1,
      sourceTenant: SOURCE_TENANT,
      schemaVersion: 5,
      tables: [templates],
    })}\n`;
    const chunks: string[] = [];
    for (let offset = 0; offset < body.length; offset += 1024) {
      chunks.push(body.slice(offset, offset + 1024));
    }

    await expect(
      backupAtVersion(pool, 5).import(TARGET_TENANT, Readable.from([manifest, ...chunks]))
    ).rejects.toMatchObject({ code: expect.any(String) });
  });
});
