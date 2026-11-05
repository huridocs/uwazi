import { createReadStream, readFileSync } from 'fs';
import { BLANK_STATE_DUMP_FILE } from '#api/infrastructure/blank_state/paths.js';
import { parseManifest } from '#api/infrastructure/tenant_backup/manifest.js';
import { PgTenantBackup } from '#api/infrastructure/tenant_backup/PgTenantBackup.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PgMigrator } from '#api/core/infrastructure/postgresql/PgMigrator.js';
import { PgMigratorFactory } from '#api/core/infrastructure/factories/PgMigratorFactory.js';

const CORE_BLANK_STATE_TABLES = [
  'settings',
  'templates',
  'thesauri',
  'relationship_types',
  'users',
  'usergroups',
  'translations',
  'pages',
  'page_locales',
  'page_releases',
];

const committedManifest = () =>
  parseManifest(readFileSync(BLANK_STATE_DUMP_FILE, 'utf8').split('\n')[0]);

describe('committed blank-state dump', () => {
  it('is at the latest Postgres migration, so a fresh database can restore it', () => {
    const { schemaVersion } = committedManifest();
    const latest = PgMigrator.latestVersionIn(PgMigratorFactory.MIGRATIONS_DIR);

    if (schemaVersion !== latest) {
      throw new Error(
        `The blank-state dump is at schema version ${schemaVersion}, the migrations at ${latest}. ` +
          'Run `yarn uwazi db blank-state upgrade` and commit the dump.'
      );
    }
  });

  it('is exported from the default tenant', () => {
    expect(committedManifest().sourceTenant).toBe('default');
  });

  it('has a well-formed manifest that includes the core blank-state tables', () => {
    const manifest = committedManifest();

    expect(manifest.schemaVersion).toBeGreaterThan(0);
    expect(manifest.tables.map(table => table.name)).toEqual(
      expect.arrayContaining(CORE_BLANK_STATE_TABLES)
    );
  });
});

describe('committed blank-state dump against a freshly migrated database', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('restores into a new tenant', async () => {
    const { pool } = testingEnvironment.pg;
    if (!pool) throw new Error('PG pool not available');

    const result = await new PgTenantBackup(pool).import(
      'restored-blank-state',
      createReadStream(BLANK_STATE_DUMP_FILE)
    );

    expect(result.sourceTenant).toBe('default');
    expect(result.rows).toBeGreaterThan(0);
    const settings = await pool.query('SELECT 1 FROM settings WHERE "tenant_id" = $1', [
      'restored-blank-state',
    ]);
    expect(settings.rowCount).toBe(1);
  });
});
