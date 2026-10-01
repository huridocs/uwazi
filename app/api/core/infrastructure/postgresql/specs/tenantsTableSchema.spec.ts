import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const tenant = (name: string) => ({
  name,
  dbName: `${name}_db`,
  indexName: `${name}_index`,
  uploadedDocuments: `${name}/documents`,
  attachments: `${name}/documents`,
  customUploads: `${name}/custom_uploads`,
  activityLogs: `${name}/log`,
});

const insert = async (values: Record<string, string>) => {
  const columns = Object.keys(values);
  return pool().query(
    `INSERT INTO tenants (${columns.map(c => `"${c}"`).join(', ')})
     VALUES (${columns.map((_c, i) => `$${i + 1}`).join(', ')})`,
    Object.values(values)
  );
};

describe('025-create-tenants-table', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM tenants');
  });

  it('should require the database, index and storage paths', async () => {
    const { rows } = await pool().query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'tenants' AND is_nullable = 'NO' AND column_default IS NULL
       ORDER BY column_name`
    );

    expect(rows.map(row => row.column_name)).toEqual([
      'activityLogs',
      'attachments',
      'customUploads',
      'dbName',
      'indexName',
      'name',
      'uploadedDocuments',
    ]);
  });

  it('should reject an empty name', async () => {
    await expect(insert(tenant(''))).rejects.toThrow();
  });

  it('should reject two tenants with the same name, database or index', async () => {
    await insert(tenant('one'));

    await expect(insert(tenant('one'))).rejects.toThrow();
    await expect(insert({ ...tenant('two'), dbName: 'one_db' })).rejects.toThrow();
    await expect(insert({ ...tenant('three'), indexName: 'one_index' })).rejects.toThrow();
  });

  it('should not enable row level security', async () => {
    const { rows } = await pool().query(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'tenants'"
    );

    expect(rows).toEqual([{ relrowsecurity: false }]);
  });

  it('should let the app user read and write tenants without a current tenant', async () => {
    const client = new Client(testingPG.appConfig);
    await client.connect();
    try {
      await client.query(
        `INSERT INTO tenants ("name", "dbName", "indexName", "uploadedDocuments", "attachments", "customUploads", "activityLogs")
         VALUES ('app', 'app_db', 'app_index', 'a', 'b', 'c', 'd')`
      );
      await client.query(`UPDATE tenants SET "maintenance" = true`);
      const { rows } = await client.query(
        'SELECT "name", "maintenance", "featureFlags", "extras" FROM tenants'
      );
      await client.query('DELETE FROM tenants');

      expect(rows).toEqual([{ name: 'app', maintenance: true, featureFlags: {}, extras: {} }]);
    } finally {
      await client.end();
    }
  });
});
