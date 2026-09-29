/* eslint-disable max-statements */
import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const TENANT = 'csv-tenant';
const OTHER_TENANT = 'csv-other-tenant';

const CSV_TABLES = [
  'csv_imports',
  'csv_import_rows',
  'csv_import_row_errors',
  'csv_import_thesauri_values',
  'csv_import_relationships_pending_values',
  'csv_import_relationships_values',
] as const;

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const insertImport = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_imports
       ("_id", "tenant_id", "template_id", "status", "created_by", "created_at", "updated_at", "file")
     VALUES ($1, $2, 'template', 'queued', 'user', 1, 1, '{"originalName": "a.csv", "mimeType": "text/csv", "size": 1}')`,
    [id, tenant]
  );

const insertRow = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_import_rows
       ("_id", "tenant_id", "import_id", "row_index", "headers", "values")
     VALUES ($1, $2, 'import', 0, '["title"]', '["A"]')`,
    [id, tenant]
  );

const insertRowError = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_import_row_errors
       ("_id", "tenant_id", "import_id", "row_index", "message", "code", "created_at")
     VALUES ($1, $2, 'import', 0, 'bad', 'VALUE_REQUIRED', 1)`,
    [id, tenant]
  );

const insertThesauri = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_import_thesauri_values
       ("_id", "tenant_id", "import_id", "thesaurus_id", "entries", "created_at")
     VALUES ($1, $2, 'import', 'th', '[]', 1)`,
    [id, tenant]
  );

const insertPending = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_import_relationships_pending_values
       ("_id", "tenant_id", "import_id", "template_id", "titles", "created_at")
     VALUES ($1, $2, 'import', 'tpl', '["Title"]', 1)`,
    [id, tenant]
  );

const insertValues = async (id: string, tenant = TENANT) =>
  pool().query(
    `INSERT INTO csv_import_relationships_values
       ("_id", "tenant_id", "import_id", "template_id", "values", "created_at")
     VALUES ($1, $2, 'import', 'tpl', '[]', 1)`,
    [id, tenant]
  );

const seedTenant = async (tenant: string) => {
  await insertImport(`import ${tenant}`, tenant);
  await insertRow(`row ${tenant}`, tenant);
  await insertRowError(`error ${tenant}`, tenant);
  await insertThesauri(`thesauri ${tenant}`, tenant);
  await insertPending(`pending ${tenant}`, tenant);
  await insertValues(`values ${tenant}`, tenant);
};

const seedBothTenants = async () => {
  await Promise.all([seedTenant(TENANT), seedTenant(OTHER_TENANT)]);
};

describe('020-create-csv-tables', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await Promise.all(CSV_TABLES.map(async table => pool().query(`DELETE FROM ${table}`)));
  });

  it.each(CSV_TABLES)(
    'should enable row level security with a tenant_isolation policy on %s',
    async table => {
      const { rows: security } = await pool().query(
        'SELECT relrowsecurity FROM pg_class WHERE relname = $1',
        [table]
      );
      const { rows: policies } = await pool().query(
        'SELECT policyname FROM pg_policies WHERE tablename = $1',
        [table]
      );

      expect(security).toEqual([{ relrowsecurity: true }]);
      expect(policies).toEqual([{ policyname: 'tenant_isolation' }]);
    }
  );

  it('should index csv_imports by tenant and created_at descending', async () => {
    const { rows } = await pool().query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'csv_imports'`
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indexname: 'csv_imports_created_at',
          indexdef: expect.stringMatching(/tenant_id.*created_at.*DESC/i),
        }),
      ])
    );
  });

  it('should reject a second csv_import_rows document with the same import and row index', async () => {
    await insertRow('first');
    await expect(insertRow('second')).rejects.toThrow(/csv_import_rows_import_id_row_index/);
  });

  it('should allow the same import and row index in another tenant', async () => {
    await insertRow('row', TENANT);
    await insertRow('row', OTHER_TENANT);

    const { rows } = await pool().query(
      'SELECT "_id", "tenant_id" FROM csv_import_rows ORDER BY "tenant_id"'
    );
    expect(rows).toEqual([
      { _id: 'row', tenant_id: OTHER_TENANT },
      { _id: 'row', tenant_id: TENANT },
    ]);
  });

  it('should allow two csv_import_row_errors for the same import and row index', async () => {
    await insertRowError('first');
    await insertRowError('second');

    const { rows } = await pool().query('SELECT "_id" FROM csv_import_row_errors ORDER BY "_id"');
    expect(rows).toEqual([{ _id: 'first' }, { _id: 'second' }]);
  });

  it('should reject a second csv_import_thesauri_values document for the same import and thesaurus', async () => {
    await insertThesauri('first');
    await expect(insertThesauri('second')).rejects.toThrow(
      /csv_import_thesauri_values_import_id_thesaurus_id/
    );
  });

  it('should reject a second pending-relationship document for the same import and template', async () => {
    await insertPending('first');
    await expect(insertPending('second')).rejects.toThrow(
      /csv_import_relationships_pending_values_import_id_template_id/
    );
  });

  it('should reject a second relationship-values document for the same import and template', async () => {
    await insertValues('first');
    await expect(insertValues('second')).rejects.toThrow(
      /csv_import_relationships_values_import_id_template_id/
    );
  });

  it.each(CSV_TABLES)(
    'should only show the current tenant rows of %s to the app user',
    async table => {
      await seedBothTenants();

      const client = new Client(testingPG.appConfig);
      await client.connect();
      try {
        await client.query("SELECT set_config('app.current_tenant', $1, false)", [TENANT]);
        const { rows } = await client.query(`SELECT "tenant_id" FROM ${table}`);

        expect(rows).toEqual([{ tenant_id: TENANT }]);
      } finally {
        await client.end();
      }
    }
  );
});
