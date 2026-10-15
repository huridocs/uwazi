import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const entry = (tenant: string, id: string) => [tenant, id, 'POST', '/api/entities', 1_000];

const INSERT = `INSERT INTO activitylogs ("tenant_id", "_id", "method", "url", "time")
                VALUES ($1, $2, $3, $4, $5)`;

describe('034-create-activitylogs-table', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM activitylogs');
  });

  it('should hold one logged request per row, with its details as text', async () => {
    const { rows } = await pool().query(
      `SELECT column_name, udt_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'activitylogs'
       ORDER BY column_name`
    );

    expect(rows).toEqual([
      { column_name: '_id', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'body', udt_name: 'text', is_nullable: 'YES' },
      { column_name: 'method', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'params', udt_name: 'text', is_nullable: 'YES' },
      { column_name: 'query', udt_name: 'text', is_nullable: 'YES' },
      { column_name: 'tenant_id', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'time', udt_name: 'int8', is_nullable: 'NO' },
      { column_name: 'url', udt_name: 'text', is_nullable: 'NO' },
      { column_name: 'user_id', udt_name: 'text', is_nullable: 'YES' },
      { column_name: 'username', udt_name: 'text', is_nullable: 'YES' },
    ]);
  });

  it('should key entries by tenant and id, and index them newest first per tenant', async () => {
    const { rows } = await pool().query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'activitylogs' ORDER BY indexname"
    );

    expect(rows).toEqual([
      { indexname: 'activitylogs_pkey', indexdef: expect.stringContaining('(tenant_id, _id)') },
      {
        indexname: 'activitylogs_tenant_time',
        indexdef: expect.stringContaining('(tenant_id, "time" DESC, _id DESC)'),
      },
    ]);
  });

  it('should refuse two entries with the same id in one tenant, and allow them across tenants', async () => {
    await pool().query(INSERT, entry('tenant-a', 'entry1'));
    await pool().query(INSERT, entry('tenant-b', 'entry1'));

    await expect(pool().query(INSERT, entry('tenant-a', 'entry1'))).rejects.toThrow(
      /activitylogs_pkey/
    );
  });

  it('should isolate tenants through row level security', async () => {
    const { rows: security } = await pool().query(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'activitylogs'"
    );
    const { rows: policies } = await pool().query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'activitylogs'"
    );

    expect(security).toEqual([{ relrowsecurity: true }]);
    expect(policies).toEqual([{ policyname: 'tenant_isolation' }]);
  });

  it('should let the app user read and write only the current tenant entries', async () => {
    await pool().query(INSERT, entry('tenant-a', 'entry-a'));
    await pool().query(INSERT, entry('tenant-b', 'entry-b'));

    const client = new Client(testingPG.appConfig);
    await client.connect();
    try {
      await client.query("SELECT set_config('app.current_tenant', $1, false)", ['tenant-a']);

      const { rows } = await client.query('SELECT "_id" FROM activitylogs');
      const deleted = await client.query('DELETE FROM activitylogs');

      expect(rows).toEqual([{ _id: 'entry-a' }]);
      expect(deleted.rowCount).toBe(1);
      await expect(client.query(INSERT, entry('tenant-b', 'intruder'))).rejects.toThrow(
        /row-level security/
      );
    } finally {
      await client.end();
    }

    const { rows: left } = await pool().query('SELECT "_id" FROM activitylogs');
    expect(left).toEqual([{ _id: 'entry-b' }]);
  });
});
