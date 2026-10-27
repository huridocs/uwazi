import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import {
  discoverDataTablesWithColumns,
  discoverTenantTables,
  EXCLUDED_TABLES,
} from '../tenantTableDiscovery.js';

/**
 * The complete, known-good set of tenant-scoped tables in the Postgres schema, and the split
 * between tenant *data* and ephemeral security artifacts. This spec is a regression guard: when
 * a migration adds, renames or drops a tenant-scoped table, it fails here and forces a decision
 * about whether that table is data (export/import/clean) or ephemeral (clean only).
 */
const ALL_TENANT_TABLES = [
  'activitylogs',
  'captchas',
  'connections',
  'csv_import_relationships_pending_values',
  'csv_import_relationships_values',
  'csv_import_row_errors',
  'csv_import_rows',
  'csv_import_thesauri_values',
  'csv_imports',
  'dataviz',
  'dataviz_snapshots',
  'entities',
  'files',
  'ix_extractors',
  'ix_models',
  'ix_suggestions',
  'jobs',
  'ocr_records',
  'page_locales',
  'page_releases',
  'pages',
  'password_recoveries',
  'preserve_sync',
  'px_entities_status',
  'px_extractors',
  'relationship_types',
  'segmentations',
  'settings',
  'syncs',
  'templates',
  'thesauri',
  'translations',
  'updatelogs',
  'usergroups',
  'users',
].sort();

const EPHEMERAL_TABLES = ['captchas', 'password_recoveries'].sort();

const DATA_TABLES = ALL_TENANT_TABLES.filter(table => !EPHEMERAL_TABLES.includes(table));

describe('tenantTableDiscovery', () => {
  let pool: Pool;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    const testPool = testingEnvironment.pg.pool;
    if (!testPool) throw new Error('PG pool not available');
    pool = testPool;
  });

  it('discovers exactly the tenant-scoped tables', async () => {
    expect([...(await discoverTenantTables(pool))].sort()).toEqual(ALL_TENANT_TABLES);
  });

  it('splits tenant tables into exactly the data tables and the ephemeral tables', async () => {
    const tables = await discoverDataTablesWithColumns(pool);

    expect(tables.map(table => table.name).sort()).toEqual(DATA_TABLES);
    expect([...EXCLUDED_TABLES].sort()).toEqual(EPHEMERAL_TABLES);
    expect(DATA_TABLES).toContain('jobs');
    expect(DATA_TABLES).toContain('csv_imports');
    expect(DATA_TABLES).toContain('px_entities_status');
  });

  it('lists tenant_id first and only once in every data table', async () => {
    const tables = await discoverDataTablesWithColumns(pool);

    for (const table of tables) {
      expect(table.columns[0]).toBe('tenant_id');
      expect(table.columns.filter(column => column === 'tenant_id')).toHaveLength(1);
      expect(table.columns.length).toBeGreaterThan(1);
    }
  });
});
