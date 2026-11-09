import { createReadStream, existsSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import {
  clearBlankState,
  seedBlankState,
} from '#api/infrastructure/blank_state/specs/blankStateFixtures.js';
import { ControllerSpecs } from '../../../../testing/ControllerSpecs.js';
import { BlankStateDumpOutputSchema } from '../../contracts.js';
import { DumpBlankStateController } from '../DumpBlankStateController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DumpBlankStateController', () => {
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
    dumpFile = path.join(__dirname, `dump-ctrl-test-${Date.now()}.uwazidump`);
    await seedBlankState(pool, testingTenants.current().name, {
      ids: { settings: 'settings-doc', user: 'user-admin', translations: ['tr-1'] },
    });
  });

  afterEach(async () => {
    rmSync(dumpFile, { force: true });
    await clearBlankState(pool);
    await pool.query('DELETE FROM relationship_types');
  });

  it('dumps every tenant data table to the dump file', async () => {
    ControllerSpecs.useBackend(true);

    const output = await ControllerSpecs.asCli(async () =>
      DumpBlankStateController.handle({ pool, dumpFile })
    );

    const { tables } = BlankStateDumpOutputSchema.parse(output);
    expect(tables).toContain('templates');
    expect(tables).toContain('settings');
    expect(tables).toContain('users');
    expect(tables).toContain('translations');
    // History tables are tenant data too: the dump is the full export stream.
    expect(tables).toContain('updatelogs');

    expect(existsSync(dumpFile)).toBe(true);
    expect(readFileSync(dumpFile, 'utf-8')).toContain('"sourceTenant"');
  });

  it('writes each table ordered by its primary key, so a regenerated dump diffs cleanly', async () => {
    ControllerSpecs.useBackend(true);
    const tenantId = testingTenants.current().name;
    await pool.query(
      `INSERT INTO relationship_types ("_id", "name", "tenant_id")
       VALUES ('rt-3', 'C', $1), ('rt-1', 'A', $1), ('rt-2', 'B', $1)`,
      [tenantId]
    );

    await ControllerSpecs.asCli(async () => DumpBlankStateController.handle({ pool, dumpFile }));

    const ids = readFileSync(dumpFile, 'utf-8')
      .split('\n')
      .filter(line => line.startsWith(`${tenantId}\trt-`))
      .map(line => line.split('\t')[1]);
    expect(ids).toEqual(['rt-1', 'rt-2', 'rt-3']);
  });

  it('produces a dump that restores into a fresh tenant', async () => {
    ControllerSpecs.useBackend(true);

    await ControllerSpecs.asCli(async () => DumpBlankStateController.handle({ pool, dumpFile }));

    await new PgTenantBackup(pool).import('fresh-tenant', createReadStream(dumpFile));

    const templates = await pool.query('SELECT name FROM templates WHERE "tenant_id" = $1', [
      'fresh-tenant',
    ]);
    expect(templates.rows).toEqual([{ name: 'Document' }]);

    const users = await pool.query('SELECT username FROM users WHERE "tenant_id" = $1', [
      'fresh-tenant',
    ]);
    expect(users.rows).toEqual([{ username: 'admin' }]);
  });
});
