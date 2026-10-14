// eslint-disable-next-line no-restricted-imports
import { mkdirSync, rmSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PgBlankState } from '../PgBlankState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENANT_A = 'tenant-a';

async function seed(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');
  await pool.query('DELETE FROM updatelogs');

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
      TENANT_A,
    ]
  );
  await pool.query(
    `INSERT INTO settings ("tenant_id","_id","site_name","languages","private","new_name_generation")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [TENANT_A, 'settings-doc', 'Uwazi', '[{"key":"en","default":true}]', true, true]
  );
  await pool.query(
    `INSERT INTO users ("_id","tenant_id","username","password","email","role")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    ['user-admin', TENANT_A, 'admin', 'secret', 'admin@uwazi.local', 'admin']
  );
  await pool.query(
    `INSERT INTO translations ("_id","language","key","value","context_id","context_type","context_label","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['tr-1', 'en', 'Document', 'Document', 'tpl-doc', 'Entity', 'Document', TENANT_A]
  );
  await pool.query(
    `INSERT INTO translations ("_id","language","key","value","context_id","context_type","context_label","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    ['tr-2', 'en', 'Title', 'Title', 'tpl-doc', 'Entity', 'Document', TENANT_A]
  );
}

async function clear(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');
  await pool.query('DELETE FROM updatelogs');
}

describe('PgBlankState dump', () => {
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
    dataDir = path.join(__dirname, `dump-test-${Date.now()}`);
    mkdirSync(dataDir, { recursive: true });
    await seed(pool);
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    await clear(pool);
  });

  const readFixture = (name: string) =>
    JSON.parse(readFileSync(path.join(dataDir, `${name}.json`), 'utf-8'));

  it('writes one fixture per non-empty config table, stripping tenant_id and keeping JSONB nested', async () => {
    const written = await new PgBlankState(pool, TENANT_A, dataDir).dump();

    expect(written.sort()).toEqual(['settings', 'templates', 'translations', 'users'].sort());

    const templates = readFixture('templates');
    expect(templates).toEqual([
      {
        _id: 'tpl-doc',
        name: 'Document',
        properties: [{ name: 'title', type: 'text' }],
        commonProperties: [{ name: 'title', label: 'Title' }],
        color: '#c03b22',
        default: true,
        entityViewPage: null,
        processing: null,
      },
    ]);

    expect(readFixture('settings')[0].languages).toEqual([{ key: 'en', default: true }]);

    const translations = readFixture('translations') as Array<{ _id: string }>;
    expect(translations.map(t => t._id)).toEqual(['tr-1', 'tr-2']);
  });

  it('skips history tables such as updatelogs', async () => {
    await pool.query(
      `INSERT INTO updatelogs ("tenant_id","id","namespace","timestamp") VALUES ($1,$2,$3,$4)`,
      [TENANT_A, 'ul-1', 'settings', 123]
    );

    const written = await new PgBlankState(pool, TENANT_A, dataDir).dump();

    expect(written).not.toContain('updatelogs');
    expect(existsSync(path.join(dataDir, 'updatelogs.json'))).toBe(false);
  });

  it('round-trips a dump into a fresh tenant', async () => {
    await new PgBlankState(pool, TENANT_A, dataDir).dump();
    await new PgBlankState(pool, 'fresh-tenant', dataDir).run();

    const target = await pool.query('SELECT * FROM templates WHERE tenant_id = $1', [
      'fresh-tenant',
    ]);
    expect(target.rows[0]).toMatchObject({
      name: 'Document',
      properties: [{ name: 'title', type: 'text' }],
      commonProperties: [{ name: 'title', label: 'Title' }],
    });

    const targetSettings = await pool.query(
      'SELECT site_name, languages, private, new_name_generation FROM settings WHERE tenant_id = $1',
      ['fresh-tenant']
    );
    expect(targetSettings.rows[0]).toEqual({
      site_name: 'Uwazi',
      languages: [{ key: 'en', default: true }],
      private: true,
      new_name_generation: true,
    });

    const targetUsers = await pool.query('SELECT username, email FROM users WHERE tenant_id = $1', [
      'fresh-tenant',
    ]);
    expect(targetUsers.rows).toEqual([{ username: 'admin', email: 'admin@uwazi.local' }]);

    const targetTranslations = await pool.query(
      'SELECT key FROM translations WHERE tenant_id = $1 ORDER BY "_id"',
      ['fresh-tenant']
    );
    expect(targetTranslations.rows).toEqual([{ key: 'Document' }, { key: 'Title' }]);
  });
});
