import { ClientSession } from 'mongodb';
import type pg from 'pg';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';
import { AutoCommitExecutor } from './AutoCommitExecutor.js';
import type { Executor, StatementListener } from './Executor.js';
import { PostgresSessionContext } from './PostgresSessionContext.js';
import type { Statement, StatementResult } from './Statement.js';
import { TransactionExecutor } from './TransactionExecutor.js';

type CommitHandler = (returnValue: unknown) => Promise<void>;
type RetryHandler = () => Promise<void>;

const SERIALIZATION_FAILURE = '40001';
const DEADLOCK_DETECTED = '40P01';

/**
 * The unit of work for one tenant. Inside `run()` every statement goes to that run's transaction;
 * outside it, each statement runs on its own (one round trip each). It decides which executor is
 * active, retries a run on serialization failures and deadlocks, and runs the commit handlers.
 */
export class PostgresTransactionManager implements TransactionManager {
  private active?: TransactionExecutor;

  private readonly autoCommit: AutoCommitExecutor;

  private readonly sessionContext: PostgresSessionContext;

  private persistentOnCommitHandlers = new Set<CommitHandler>();

  private persistentOnRetryHandlers = new Set<RetryHandler>();

  private runOnCommitHandlers = new Set<CommitHandler>();

  private runOnRetryHandlers = new Set<RetryHandler>();

  constructor(
    private readonly pool: pg.Pool,
    tenantId: string,
    private readonly logger: Logger
  ) {
    this.sessionContext = new PostgresSessionContext(tenantId);
    this.autoCommit = new AutoCommitExecutor(pool, this.sessionContext, this.onStatement);
  }

  /** Every message the executors send is announced, so specs can count them. */
  private readonly onStatement: StatementListener = PostgresDB.announceStatement;

  /** The running transaction's executor, or the one that runs each statement on its own. */
  executor(): Executor {
    return this.active ?? this.autoCommit;
  }

  async query<TRow = Record<string, unknown>>(
    statement: Statement
  ): Promise<StatementResult<TRow>> {
    return this.executor().query<TRow>(statement);
  }

  async queryAll(statements: Statement[]): Promise<StatementResult[]> {
    return this.executor().queryAll(statements);
  }

  stream<TRow = Record<string, unknown>>(
    statement: Statement
  ): AsyncGenerator<TRow, void, unknown> {
    return this.executor().stream<TRow>(statement);
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    if (this.active) throw new Error('Transaction already in progress.');
    this.clearRunHandlers();
    try {
      const returnValue = await this.runWithRetry(callback);
      await this.executeOnCommitHandlers(returnValue);
      return returnValue;
    } finally {
      this.clearRunHandlers();
    }
  }

  runHandlingOnCommitted<T>(callback: () => Promise<T>) {
    return {
      onCommitted: async (handler: (returnValue: T) => Promise<void>) =>
        this.run(async () => {
          const returnValue = await callback();
          this.runOnCommitHandlers.add(async () => handler(returnValue));
          return returnValue;
        }),
    };
  }

  isRunning(): boolean {
    return !!this.active;
  }

  onCommitted(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnCommitHandlers.add(handler);
    } else {
      this.persistentOnCommitHandlers.add(handler);
    }
    return this;
  }

  onRetry(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnRetryHandlers.add(handler);
    } else {
      this.persistentOnRetryHandlers.add(handler);
    }
    return this;
  }

  /** Migration bridge: Mongo-backed sources expect a session; Postgres has none. */
  // eslint-disable-next-line class-methods-use-this
  getSession(): ClientSession | undefined {
    return undefined;
  }

  private async runWithRetry<T>(callback: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await this.runInTransaction(callback);
    } catch (error) {
      if (PostgresTransactionManager.shouldRetry(error, retries)) {
        this.logger.debug(String(error));
        await this.executeOnRetryHandlers();
        this.clearRunHandlers();
        return this.runWithRetry(callback, retries - 1);
      }
      throw error;
    }
  }

  /** Statements sent while the commit is under way reach a closed transaction and fail. */
  private async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const transaction = new TransactionExecutor(this.pool, this.sessionContext, this.onStatement);
    this.active = transaction;
    try {
      const result = await callback();
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      this.active = undefined;
    }
  }

  private static shouldRetry(error: unknown, retries: number): boolean {
    if (retries <= 0) return false;
    const code = (error as { code?: string })?.code;
    return code === SERIALIZATION_FAILURE || code === DEADLOCK_DETECTED;
  }

  private async executeOnCommitHandlers(returnValue: unknown) {
    return Promise.all(
      [...this.persistentOnCommitHandlers, ...this.runOnCommitHandlers].map(async h =>
        h(returnValue)
      )
    );
  }

  private async executeOnRetryHandlers() {
    return Promise.all(
      [...this.persistentOnRetryHandlers, ...this.runOnRetryHandlers].map(async h => h())
    );
  }

  private clearRunHandlers() {
    this.runOnCommitHandlers.clear();
    this.runOnRetryHandlers.clear();
  }
}
