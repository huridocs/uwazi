import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const INSERT = `INSERT INTO preserve_sync ("tenant_id", "token", "last_import")
                VALUES ($1, $2, $3)`;

const withTenant = async (tenant: string, fn: (client: Client) => Promise<void>): Promise<void> => {
  const client = new Client(testingPG.appConfig);
  await client.connect();
  try {
    await client.query("SELECT set_config('app.current_tenant', $1, false)", [tenant]);
    await fn(client);
  } finally {
    await client.end();
  }
};

describe('035-create-preserve-sync-table', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM preserve_sync');
  });

  it('should store one cursor per token, with the import date as text', async () => {
    const { rows } = await pool().query(
      `SELECT column_name, udt_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'preserve_sync'
       ORDER BY column_name`
    );

    expect(rows).toEqual([
      { column_name: 'last_import', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'tenant_id', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'token', udt_name: 'text', is_nullable: 'NO' },
    ]);
  });

  it('should key cursors by tenant and token', async () => {
    const { rows } = await pool().query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'preserve_sync'"
    );

    expect(rows).toEqual([
      {
        indexname: 'preserve_sync_pkey',
        indexdef: expect.stringContaining('(tenant_id, token)'),
      },
    ]);
  });

  it('should refuse two cursors for one token in a tenant, and allow that token in another', async () => {
    await pool().query(INSERT, ['tenant-a', 'auth-token', '2020-01-01T00:00:00.000Z']);
    await pool().query(INSERT, ['tenant-b', 'auth-token', '2020-01-01T00:00:00.000Z']);

    await expect(
      pool().query(INSERT, ['tenant-a', 'auth-token', '2020-02-01T00:00:00.000Z'])
    ).rejects.toThrow(/preserve_sync_pkey/);
  });

  it('should isolate tenants through row level security', async () => {
    const { rows: security } = await pool().query(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'preserve_sync'"
    );
    const { rows: policies } = await pool().query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'preserve_sync'"
    );

    expect(security).toEqual([{ relrowsecurity: true }]);
    expect(policies).toEqual([{ policyname: 'tenant_isolation' }]);
  });

  it('should let the app user read and write only the current tenant cursor', async () => {
    await pool().query(INSERT, ['tenant-a', 'auth-token', '2020-01-01T00:00:00.000Z']);
    await pool().query(INSERT, ['tenant-b', 'auth-token', '2020-03-01T00:00:00.000Z']);

    await withTenant('tenant-a', async client => {
      const { rows } = await client.query('SELECT "token", "last_import" FROM preserve_sync');
      const updated = await client.query(
        `UPDATE preserve_sync SET "last_import" = '2020-06-01T00:00:00.000Z'`
      );

      expect(rows).toEqual([{ token: 'auth-token', last_import: '2020-01-01T00:00:00.000Z' }]);
      expect(updated.rowCount).toBe(1);
      await expect(
        client.query(INSERT, ['tenant-b', 'other-token', '2020-01-01T00:00:00.000Z'])
      ).rejects.toThrow(/row-level security/);
    });

    const { rows: left } = await pool().query(
      'SELECT "tenant_id", "last_import" FROM preserve_sync ORDER BY "tenant_id"'
    );
    expect(left).toEqual([
      { tenant_id: 'tenant-a', last_import: '2020-06-01T00:00:00.000Z' },
      { tenant_id: 'tenant-b', last_import: '2020-03-01T00:00:00.000Z' },
    ]);
  });
});
