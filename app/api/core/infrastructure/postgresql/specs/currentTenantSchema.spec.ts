import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const asAppUser = async <T>(fn: (client: Client) => Promise<T>): Promise<T> => {
  const client = new Client(testingPG.appConfig);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
};

const tokensSeenBy = async (client: Client) =>
  (await client.query('SELECT token FROM preserve_sync ORDER BY token')).rows.map(row => row.token);

describe('037-current-tenant-rejects-empty', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM preserve_sync');
    await pool().query(
      `INSERT INTO preserve_sync ("tenant_id", "token", "last_import")
       VALUES ('tenant-a', 'token-a', '2020-01-01'), ('tenant-b', 'token-b', '2020-01-01')`
    );
  });

  it('should show a tenant only its own rows', async () => {
    const tokens = await asAppUser(async client => {
      await client.query("SELECT set_config('app.current_tenant', 'tenant-a', false)");
      return tokensSeenBy(client);
    });

    expect(tokens).toEqual(['token-a']);
  });

  it('should refuse a query when no tenant was ever set on the connection', async () => {
    await expect(asAppUser(tokensSeenBy)).rejects.toThrow('app.current_tenant is not set');
  });

  it('should refuse a query when the tenant is empty, as on a connection reused after a transaction', async () => {
    await expect(
      asAppUser(async client => {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant', 'tenant-a', true)");
        await client.query('COMMIT');
        return tokensSeenBy(client);
      })
    ).rejects.toThrow('app.current_tenant is not set');
  });

  it('should stay a stable SQL function, so the planner can inline it into the policies', async () => {
    const { rows } = await pool().query(
      `SELECT p.provolatile, l.lanname
       FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
       WHERE p.proname = 'current_tenant'`
    );

    expect(rows).toEqual([{ provolatile: 's', lanname: 'sql' }]);
  });
});
