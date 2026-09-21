import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import {
  DefaultPostgresQueueAdapter,
  PostgresRoundRobinQueueAdapter,
} from '#api/core/libs/queue/configuration/factories.js';
import { PostgresQueueAdapter } from '../PostgresQueueAdapter.js';
import {
  describeQueueAdapterContract,
  pushInput,
  QueueAdapterHarness,
  StoredJob,
  storedJob,
} from './QueueAdapterContract.js';

const pool = () => {
  const { pool: adminPool } = testingEnvironment.pg;
  if (!adminPool) throw new Error('PG pool not available');
  return adminPool;
};

const insert = async (jobs: StoredJob[]) => {
  await Promise.all(
    jobs.map(async job =>
      pool().query(
        `INSERT INTO jobs
           ("id", "queue", "name", "namespace", "params", "lockedUntil", "createdAt", "retryCount", "failed", "options")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          job.id,
          job.queue,
          job.name,
          job.namespace,
          JSON.stringify(job.params),
          job.lockedUntil,
          job.createdAt,
          job.retryCount,
          job.failed,
          JSON.stringify(job.options),
        ]
      )
    )
  );
};

const stored = async (): Promise<StoredJob[]> => {
  const { rows } = await pool().query('SELECT * FROM jobs');
  return rows.map(row => ({
    ...row,
    lockedUntil: Number(row.lockedUntil),
    createdAt: Number(row.createdAt),
  }));
};

const transactionManager = () =>
  new PostgresTransactionManager(PostgresDB.knex, 'tenant', LoggerFactory.default());

const postgresHarness = async (): Promise<QueueAdapterHarness> => {
  await testingEnvironment.setUp({}, { postgres: true });
  await pool().query('DELETE FROM jobs');
  return {
    adapter: () => DefaultPostgresQueueAdapter(transactionManager()),
    roundRobinAdapter: () => PostgresRoundRobinQueueAdapter(),
    insert,
    stored,
  };
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describeQueueAdapterContract('PostgresQueueAdapter', postgresHarness);

describe('PostgresQueueAdapter', () => {
  beforeEach(async () => {
    await postgresHarness();
  });

  it('should never hand the same job to two concurrent picks', async () => {
    await insert(Array.from({ length: 20 }, (_, index) => storedJob({ createdAt: index + 1 })));
    const adapters = [PostgresRoundRobinQueueAdapter(), PostgresRoundRobinQueueAdapter()];

    const picked = await Promise.all(
      Array.from({ length: 20 }, async (_, index) => adapters[index % 2].pickJob('queue name'))
    );

    const ids = picked.map(job => job?.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids).not.toContain(undefined);
  });

  it('should commit worker side updates outside the transaction open around them', async () => {
    const job = storedJob();
    await insert([job]);
    const manager = transactionManager();
    const adapter = DefaultPostgresQueueAdapter(manager);

    await manager.run(async () => {
      await adapter.renewJobLock(job);
      const [seenByAnotherConnection] = await stored();
      expect(seenByAnotherConnection.lockedUntil).toBeGreaterThan(0);
    });
  });

  it('should push within the transaction that is running, and roll back with it', async () => {
    const manager = transactionManager();
    const adapter = DefaultPostgresQueueAdapter(manager);

    await expect(
      manager.run(async () => {
        await adapter.pushJob(pushInput());
        await adapter.pushJobs([pushInput(), pushInput()]);
        expect(await adapter.countByName('a simple message', 'namespace')).toBe(3);
        expect(await stored()).toEqual([]);
        throw new Error('rolled back');
      })
    ).rejects.toThrow('rolled back');

    expect(await stored()).toEqual([]);
  });

  it('should roll back a batch too large for a single statement as a whole', async () => {
    const manager = transactionManager();
    const adapter = DefaultPostgresQueueAdapter(manager);

    await expect(
      manager.run(async () => {
        await adapter.pushJobs(Array.from({ length: 7000 }, () => pushInput()));
        throw new Error('rolled back');
      })
    ).rejects.toThrow('rolled back');

    expect(await stored()).toEqual([]);
  });

  it.each([
    {
      case: 'on a transaction manager with no transaction running',
      adapter: () => DefaultPostgresQueueAdapter(transactionManager()),
    },
    {
      case: 'without a transaction manager',
      adapter: () =>
        new PostgresQueueAdapter({ workerKnex: PostgresDB.knex, logger: LoggerFactory.default() }),
    },
  ])('should store none of a batch when one of its chunks fails, $case', async ({ adapter }) => {
    const jobs = Array.from({ length: 2500 }, () => pushInput());
    jobs[1500] = pushInput({ name: null as unknown as string });

    await expect(adapter().pushJobs(jobs)).rejects.toThrow('null value in column "name"');

    expect(await stored()).toEqual([]);
  });

  it('should commit a push right away when no transaction is running', async () => {
    const id = await DefaultPostgresQueueAdapter(transactionManager()).pushJob(pushInput());

    expect(await stored()).toEqual([expect.objectContaining({ id })]);
  });

  it('should give new jobs UUIDv7 ids', async () => {
    const adapter = DefaultPostgresQueueAdapter(transactionManager());
    const uuidv7 = expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    const ids = [await adapter.pushJob(pushInput()), ...(await adapter.pushJobs([pushInput()]))];

    expect(ids).toEqual([uuidv7, uuidv7]);
  });

  it('should keep polling, with a warning, while the jobs table does not exist', async () => {
    const warning = jest.fn();
    const adapter = new PostgresQueueAdapter({
      workerKnex: PostgresDB.knex,
      logger: { warning } as unknown as Logger,
    });
    await pool().query('ALTER TABLE jobs RENAME TO jobs_elsewhere');

    try {
      expect(await adapter.pickJob('queue name')).toBe(null);
      expect(warning).toHaveBeenCalledWith(expect.stringContaining('jobs table does not exist'));
    } finally {
      await pool().query('ALTER TABLE jobs_elsewhere RENAME TO jobs');
    }
  });
});
