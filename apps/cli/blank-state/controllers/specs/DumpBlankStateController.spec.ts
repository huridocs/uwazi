// eslint-disable-next-line no-restricted-imports
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { BlankStateDumpOutputSchema } from '../../contracts.js';
import { DumpBlankStateController } from '../DumpBlankStateController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed(pool: Pool, tenantId: string): Promise<void> {
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
    [tenantId, 'settings-doc', 'Uwazi', '[{"key":"en","default":true}]', true, true]
  );
  await pool.query(
    `INSERT INTO users ("_id","tenant_id","username","password","email","role")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    ['user-admin', tenantId, 'admin', 'secret', 'admin@uwazi.local', 'admin']
  );
  await pool.query(
    `INSERT INTO translations ("_id","language","key","value","context_id","context_type","context_label","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['tr-1', 'en', 'Document', 'Document', 'tpl-doc', 'Entity', 'Document', tenantId]
  );
}

async function clear(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');
}

describe('DumpBlankStateController', () => {
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
    dataDir = path.join(__dirname, `dump-ctrl-test-${Date.now()}`);
    mkdirSync(dataDir, { recursive: true });
    await seed(pool, testingTenants.current().name);
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    await clear(pool);
  });

  it('should dump the current tenant into the given directory', async () => {
    const format = jest.fn(async () => {});

    const output = await ControllerSpecs.asCli(async () =>
      DumpBlankStateController.handle({ pool, dataDir, format })
    );

    expect(BlankStateDumpOutputSchema.parse(output).tables.sort()).toEqual(
      ['settings', 'templates', 'translations', 'users'].sort()
    );
    expect(format).toHaveBeenCalledWith(dataDir, [
      'settings',
      'templates',
      'translations',
      'users',
    ]);

    const templates = JSON.parse(readFileSync(path.join(dataDir, 'templates.json'), 'utf-8'));
    expect(templates[0]).toMatchObject({ _id: 'tpl-doc', name: 'Document' });

    expect(existsSync(path.join(dataDir, 'updatelogs.json'))).toBe(false);
  });
});
