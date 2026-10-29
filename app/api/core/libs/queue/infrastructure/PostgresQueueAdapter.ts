import { Knex } from 'knex';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import {
  Statements,
  type Statement,
  type StatementResult,
} from '#api/core/infrastructure/postgresql/common/Statement.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { Params } from '../application/contracts/Dispatchable.js';
import { Job, PushJobInput, QueueAdapter } from './QueueAdapter.js';
import { uuidv7 } from './uuidv7.js';

type JobRow = {
  id: string;
  queue: string;
  name: string;
  namespace: string;
  params: any;
  lockedUntil: number | string;
  createdAt: number | string;
  retryCount: number;
  failed: boolean;
  options: Job['options'];
};

type Dependencies = {
  /** Worker side connection (app user). Never joins the transaction of the handler it runs. */
  workerKnex: Knex;
  /** Dispatch side: pushes and deletes join the transaction running on it, if any. */
  transactionManager?: PostgresTransactionManager;
  logger: Logger;
  /**
   * Extra columns to add to every inserted job row. Generic on purpose: the queue library knows
   * nothing of tenants; a Uwazi adapter supplies the tenant-scoped columns through this hook.
   */
  decorateJobRow?: (job: PushJobInput) => Record<string, unknown>;
  /**
   * Column names the decorateJobRow hook may add to `jobs`. When any of them does not exist yet
   * (its schema migration has not run), the adapter skips decoration and inserts the base row.
   * TEMPORARY: remove once the `tenant_id` schema migration is guaranteed deployed everywhere.
   */
  decoratedColumns?: string[];
};

const UNDEFINED_TABLE = '42P01';

/**
 * Rows per INSERT. A statement takes at most 65535 bind parameters and a job row uses 10, so a
 * large dispatchMany batch is split into statements of this size.
 */
const INSERT_CHUNK_ROWS = 1000;

const toJob = (row: JobRow): Job & { failed: boolean } => ({
  id: row.id,
  queue: row.queue,
  name: row.name,
  params: row.params,
  namespace: row.namespace,
  lockedUntil: Number(row.lockedUntil),
  createdAt: Number(row.createdAt),
  retryCount: row.retryCount,
  failed: row.failed,
  options: row.options,
});

const toRow = (job: PushJobInput, now: number) => ({
  id: uuidv7(now),
  queue: job.queue,
  name: job.name,
  namespace: job.namespace,
  params: JSON.stringify(job.params ?? {}),
  lockedUntil: job.lockedUntil ?? 0,
  createdAt: now,
  retryCount: 0,
  failed: false,
  options: JSON.stringify(job.options),
});

export class PostgresQueueAdapter implements QueueAdapter {
  protected deps: Dependencies;

  constructor(deps: Dependencies) {
    this.deps = deps;
  }

  /**
   * Runs dispatch side queries, all of them or none: on the transaction running on the manager,
   * or in one opened for them on the worker connection when there is no manager.
   */
  private async dispatch(queries: Knex.QueryBuilder[]): Promise<StatementResult[]> {
    const statements = queries.map(qb => Statements.fromBuilder(qb, 'inherit'));
    if (this.deps.transactionManager) {
      return this.deps.transactionManager.queryAll(statements);
    }
    if (statements.length === 1) {
      return [await PostgresQueueAdapter.send(this.deps.workerKnex, statements[0])];
    }
    return this.deps.workerKnex.transaction(async trx =>
      ArrayUtils.sequentialFor(statements, async statement =>
        PostgresQueueAdapter.send(trx, statement)
      )
    );
  }

  private static async send(db: Knex, { sql, bindings }: Statement): Promise<StatementResult> {
    const { rows, rowCount } = await db.raw(sql, bindings as Knex.RawBinding[]);
    return { rows, rowCount: rowCount ?? 0 };
  }

  /** Each param must equal the job's, compared as JSON so arrays and objects match whole. */
  private static whereParams(query: Knex.QueryBuilder, params: Partial<Params>) {
    Object.entries(params).forEach(([key, value]) => {
      query.whereRaw('"params" -> ? = ?::jsonb', [key, JSON.stringify(value)]);
    });
    return query;
  }

  async pushJob(job: PushJobInput): Promise<string> {
    const [id] = await this.pushJobs([job]);
    return id;
  }

  async pushJobs(jobs: PushJobInput[]): Promise<string[]> {
    if (!jobs.length) return [];

    const now = Date.now();
    const decorate = await this.shouldDecorate();
    const rows = jobs.map(job => ({
      ...toRow(job, now),
      ...(decorate ? (this.deps.decorateJobRow?.(job) ?? {}) : {}),
    }));
    await this.dispatch(
      ArrayUtils.splitInChunks(rows, INSERT_CHUNK_ROWS).map(chunk =>
        Statements.builder('jobs').insert(chunk)
      )
    );
    return rows.map(row => row.id);
  }

  /** Whether to apply decorateJobRow now: only if every column it declares already exists. */
  private async shouldDecorate(): Promise<boolean> {
    if (!this.deps.decorateJobRow) return false;
    const columns = this.deps.decoratedColumns;
    if (!columns || columns.length === 0) return true;
    return this.decoratedColumnsExist(columns);
  }

  private async decoratedColumnsExist(columns: string[]): Promise<boolean> {
    const placeholders = columns.map(() => '?').join(', ');
    const { rows } = await this.deps.workerKnex.raw<{ rows: { present: number }[] }>(
      `SELECT COUNT(*)::int AS present
       FROM pg_attribute
       WHERE attrelid = 'jobs'::regclass
         AND attnum > 0
         AND NOT attisdropped
         AND attname IN (${placeholders})`,
      columns
    );
    return Number(rows[0].present) === columns.length;
  }

  async deleteByParams(
    jobName: string,
    params: Partial<Params>,
    tenantName: string
  ): Promise<void> {
    if (!Object.keys(params).length) return;

    await this.dispatch([
      PostgresQueueAdapter.whereParams(Statements.builder('jobs'), params)
        .where({ name: jobName, namespace: tenantName })
        .where('lockedUntil', '<', Date.now())
        .delete(),
    ]);
  }

  async cancelByParams(
    jobName: string,
    params: Partial<Params>,
    tenantName: string
  ): Promise<void> {
    if (!Object.keys(params).length) return;

    await this.dispatch([
      PostgresQueueAdapter.whereParams(Statements.builder('jobs'), params)
        .where({ name: jobName, namespace: tenantName })
        .delete(),
    ]);
  }

  async countByName(jobName: string, tenantName: string): Promise<number> {
    const [{ rows }] = await this.dispatch([
      Statements.builder('jobs')
        .where({ name: jobName, namespace: tenantName })
        .count({ count: '*' }),
    ]);
    return Number(rows[0].count);
  }

  async pickJob(queueName: string): Promise<Job | null> {
    return this.pick(queueName);
  }

  /**
   * Jobs whose last attempt never reported back (the worker died) keep failed = false, so they would
   * stay in the jobs_pick index forever. Once that attempt's lock expires they are failed, as the
   * Mongo adapter does.
   */
  private async markExceededRetryJobsAsFailed(queueName: string, now: number): Promise<void> {
    await this.deps
      .workerKnex('jobs')
      .where({ queue: queueName, failed: false })
      .where('lockedUntil', '<', now)
      .whereRaw('"retryCount" >= ("options"->>\'maxRetries\')::int')
      .update({ failed: true });
  }

  /**
   * Locks and returns the oldest pickable job in one statement. SKIP LOCKED lets concurrent
   * workers pass over a row another one is taking instead of waiting for it.
   */
  protected async pick(queueName: string, excludeNamespaces: string[] = []): Promise<Job | null> {
    const now = Date.now();
    const excluded = excludeNamespaces.length
      ? `AND "namespace" NOT IN (${excludeNamespaces.map(() => '?').join(', ')})`
      : '';

    try {
      await this.markExceededRetryJobsAsFailed(queueName, now);

      const { rows } = await this.deps.workerKnex.raw<{ rows: JobRow[] }>(
        `UPDATE jobs
         SET "lockedUntil" = ? + ("options"->>'lockWindow')::bigint,
             "retryCount" = "retryCount" + 1
         WHERE "id" = (
           SELECT "id" FROM jobs
           WHERE "queue" = ?
             AND NOT "failed"
             AND "lockedUntil" < ?
             AND "retryCount" < ("options"->>'maxRetries')::int
             ${excluded}
           ORDER BY "createdAt", "id"
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [now, queueName, now, ...excludeNamespaces]
      );
      return rows.length ? toJob(rows[0]) : null;
    } catch (error) {
      if ((error as { code?: string }).code === UNDEFINED_TABLE) {
        this.deps.logger.warning(
          'Postgres queue: the jobs table does not exist yet, waiting for the schema migration'
        );
        return null;
      }
      throw error;
    }
  }

  async renewJobLock(job: Job): Promise<void> {
    await this.deps
      .workerKnex('jobs')
      .where({ id: job.id })
      .update({ lockedUntil: Date.now() + job.options.lockWindow });
  }

  async deleteJob(job: Job): Promise<void> {
    await this.deps.workerKnex('jobs').where({ id: job.id }).delete();
  }

  async markJobAsFailed(job: Job): Promise<Job> {
    const [row] = await this.deps
      .workerKnex('jobs')
      .where({ id: job.id })
      .update({ failed: true })
      .returning<JobRow[]>('*');

    if (!row) {
      throw new Error(`Failed to mark job as failed: ${job.id}`);
    }
    return toJob(row);
  }

  async updateLockWindow(job: Job, newLockWindow: number, lockedUntil?: number): Promise<Job> {
    const [row] = await this.deps
      .workerKnex('jobs')
      .where({ id: job.id })
      .update({
        options: this.deps.workerKnex.raw(
          `jsonb_set("options", '{lockWindow}', to_jsonb(?::bigint))`,
          [newLockWindow]
        ),
        ...(lockedUntil !== undefined ? { lockedUntil } : {}),
      })
      .returning<JobRow[]>('*');

    if (!row) {
      throw new Error(`Failed to update lock window for job: ${job.id}`);
    }
    return toJob(row);
  }
}
