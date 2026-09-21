import { Client } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const insertJob = async (id: string, namespace: string) =>
  pool().query(
    `INSERT INTO jobs ("id", "queue", "name", "namespace", "createdAt", "options")
     VALUES ($1, 'queue', 'TestJob', $2, 1, '{"lockWindow": 1000, "maxRetries": 5}')`,
    [id, namespace]
  );

describe('020-create-jobs-table', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    await pool().query('DELETE FROM jobs');
  });

  it('should apply the defaults of a job that was never picked', async () => {
    await insertJob('job', 'tenant');

    const { rows } = await pool().query(
      'SELECT "params", "lockedUntil", "retryCount", "failed" FROM jobs'
    );

    expect(rows).toEqual([{ params: {}, lockedUntil: '0', retryCount: 0, failed: false }]);
  });

  it('should index picks by queue and creation order, skipping failed jobs', async () => {
    const { rows } = await pool().query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'jobs' ORDER BY indexname"
    );

    expect(rows).toEqual([
      {
        indexname: 'jobs_namespace_name',
        indexdef: expect.stringContaining('(namespace, name)'),
      },
      {
        indexname: 'jobs_pick',
        indexdef: expect.stringMatching(/\(queue, "createdAt", id\) WHERE \(failed = false\)$/),
      },
      { indexname: 'jobs_pkey', indexdef: expect.stringContaining('(id)') },
    ]);
  });

  it('should vacuum after a fixed number of dead rows, whatever the table size', async () => {
    const { rows } = await pool().query("SELECT reloptions FROM pg_class WHERE relname = 'jobs'");

    expect(rows).toEqual([
      {
        reloptions: ['autovacuum_vacuum_scale_factor=0', 'autovacuum_vacuum_threshold=1000'],
      },
    ]);
  });

  it('should not enable row level security', async () => {
    const { rows: security } = await pool().query(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'jobs'"
    );
    const { rows: policies } = await pool().query(
      "SELECT policyname FROM pg_policies WHERE tablename = 'jobs'"
    );

    expect(security).toEqual([{ relrowsecurity: false }]);
    expect(policies).toEqual([]);
  });

  it('should let the app user read and write every namespace without a current tenant', async () => {
    await insertJob('job tenant', 'tenant');
    await insertJob('job system', 'system');

    const client = new Client(testingPG.appConfig);
    await client.connect();
    try {
      await client.query(`UPDATE jobs SET "retryCount" = 1`);
      await client.query(`DELETE FROM jobs WHERE "id" = 'job system'`);
      const { rows } = await client.query('SELECT "id", "retryCount" FROM jobs');

      expect(rows).toEqual([{ id: 'job tenant', retryCount: 1 }]);
    } finally {
      await client.end();
    }
  });
});
