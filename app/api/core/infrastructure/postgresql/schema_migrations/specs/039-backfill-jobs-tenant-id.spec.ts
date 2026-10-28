import type { Pool } from 'pg';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { migration } from '../039-backfill-jobs-tenant-id.js';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const SYSTEM = 'system';

type Job = {
  id: string;
  queue: string;
  name: string;
  namespace: string;
  params: Record<string, unknown>;
  lockedUntil: number;
  createdAt: number;
  retryCount: number;
  failed: boolean;
  options: Record<string, unknown>;
};

const job = (overrides: Partial<Job> & { id: string; namespace: string }): Job => ({
  queue: 'queue name',
  name: 'a job',
  params: {},
  lockedUntil: 0,
  createdAt: 1,
  retryCount: 0,
  failed: false,
  options: { lockWindow: 1000, maxRetries: 3 },
  ...overrides,
});

const insertJob = async (pool: Pool, row: Job): Promise<void> => {
  await pool.query(
    `INSERT INTO jobs
       ("id", "queue", "name", "namespace", "params", "lockedUntil", "createdAt", "retryCount", "failed", "options")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      row.id,
      row.queue,
      row.name,
      row.namespace,
      JSON.stringify(row.params),
      row.lockedUntil,
      row.createdAt,
      row.retryCount,
      row.failed,
      JSON.stringify(row.options),
    ]
  );
};

const scopeByNamespace = async (pool: Pool): Promise<Record<string, string | null>> => {
  const { rows } = await pool.query<{ namespace: string; tenant_id: string | null }>(
    'SELECT "namespace", "tenant_id" FROM jobs ORDER BY "namespace", "id"'
  );
  return Object.fromEntries(rows.map(row => [row.namespace, row.tenant_id]));
};

describe('039-backfill-jobs-tenant-id', () => {
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
    await pool.query('DELETE FROM jobs');
  });

  afterEach(async () => {
    await pool.query('DELETE FROM jobs');
  });

  const run = async () => testingEnvironment.pg.runDataMigration(migration, []);

  it('should backfill tenant_id from namespace, leaving system jobs at NULL', async () => {
    await insertJob(pool, job({ id: 'job-a', namespace: TENANT_A }));
    await insertJob(pool, job({ id: 'job-b', namespace: TENANT_B }));
    await insertJob(pool, job({ id: 'job-system', namespace: SYSTEM }));

    await run();

    expect(await scopeByNamespace(pool)).toEqual({
      [TENANT_A]: TENANT_A,
      [TENANT_B]: TENANT_B,
      [SYSTEM]: null,
    });
  });

  it('should give the same result when run twice', async () => {
    await insertJob(pool, job({ id: 'job-a', namespace: TENANT_A }));
    await insertJob(pool, job({ id: 'job-system', namespace: SYSTEM }));

    await run();
    const once = await scopeByNamespace(pool);

    await run();

    expect(await scopeByNamespace(pool)).toEqual(once);
  });

  it('should do nothing on an empty table', async () => {
    await run();

    expect(await scopeByNamespace(pool)).toEqual({});
  });
});
