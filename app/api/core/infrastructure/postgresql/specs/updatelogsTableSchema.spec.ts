import { testingEnvironment } from '#api/utils/testingEnvironment.js';

const INSERT = `INSERT INTO updatelogs ("tenant_id", "id", "namespace", "timestamp", "deleted")
                VALUES ($1, $2, $3, $4, $5)`;

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

describe('036-updatelogs-key-includes-namespace', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM updatelogs');
  });

  it('should key a log by tenant, namespace, and document id', async () => {
    const { rows } = await pool().query(
      "SELECT indexdef FROM pg_indexes WHERE tablename = 'updatelogs' AND indexname = 'updatelogs_pkey'"
    );

    expect(rows).toEqual([{ indexdef: expect.stringContaining('(tenant_id, namespace, id)') }]);
  });

  it('should keep the same document id in two namespaces and reject a second log in one', async () => {
    await pool().query(INSERT, ['tenant-a', 'doc-1', 'entities', 100, false]);
    await pool().query(INSERT, ['tenant-a', 'doc-1', 'connections', 300, true]);

    await expect(
      pool().query(INSERT, ['tenant-a', 'doc-1', 'entities', 400, false])
    ).rejects.toThrow(/updatelogs_pkey/);
  });
});
