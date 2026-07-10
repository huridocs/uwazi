import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';

type CommitHandler = (returnValue: unknown) => Promise<void>;
type RetryHandler = () => Promise<void>;

const SERIALIZATION_FAILURE = '40001';
const DEADLOCK_DETECTED = '40P01';

export class PostgresTransactionManager implements TransactionManager {
  private knex: Knex;

  private tenantId: string;

  private logger: Logger;

  private activeTransaction?: Knex.Transaction;

  private persistentOnCommitHandlers: CommitHandler[];

  private persistentOnRetryHandlers: RetryHandler[];

  private runOnCommitHandlers: CommitHandler[];

  private runOnRetryHandlers: RetryHandler[];

  constructor(knex: Knex, tenantId: string, logger: Logger) {
    this.knex = knex;
    this.tenantId = tenantId;
    this.logger = logger;
    this.persistentOnCommitHandlers = [];
    this.persistentOnRetryHandlers = [];
    this.runOnCommitHandlers = [];
    this.runOnRetryHandlers = [];
  }

  /**
   * Runs `fn` with a tenant-scoped Knex executor.
   *
   * Case #2 — a `run()` transaction is already active: reuse it so multiple
   * operations share the same transactional scope and tenant GUC.
   *
   * Case #1 — no active transaction: open a short-lived, self-scoped transaction
   * and set `app.current_tenant` for RLS.
   *
   * NOTE (migration trade-off): a case #1 write executed while an *outer* Mongo
   * `transactionManager.run()` later rolls back is NOT reverted — its own PG
   * transaction has already committed. This is intentional during the
   * Mongo→Postgres transition. Once a use case's whole footprint lives on
   * Postgres and adopts `PostgresTransactionManager.run()`, writes fall into
   * case #2 and become fully transactional.
   */
  async withConnection<T>(fn: (executor: Knex) => Promise<T>): Promise<T> {
    if (this.activeTransaction) {
      return fn(this.activeTransaction);
    }

    return this.knex.transaction(async trx => {
      await PostgresTransactionManager.setTenant(trx, this.tenantId);
      return fn(trx);
    });
  }

  private static async setTenant(trx: Knex.Transaction, tenantId: string): Promise<void> {
    await trx.raw("SELECT set_config('app.current_tenant', ?, true)", [tenantId]);
  }

  private async executeOnCommitHandlers(returnValue: unknown) {
    return Promise.all(
      [...this.persistentOnCommitHandlers, ...this.runOnCommitHandlers].map(async handler =>
        handler(returnValue)
      )
    );
  }

  private async executeOnRetryHandlers() {
    return Promise.all(
      [...this.persistentOnRetryHandlers, ...this.runOnRetryHandlers].map(async handler =>
        handler()
      )
    );
  }

  private clearRunHandlers() {
    this.runOnCommitHandlers = [];
    this.runOnRetryHandlers = [];
  }

  private validateState() {
    if (this.activeTransaction) {
      throw new Error('Transaction already in progress.');
    }
  }

  private static shouldRetry(error: unknown, retries: number): boolean {
    if (retries <= 0) return false;
    const code = (error as { code?: string })?.code;
    return code === SERIALIZATION_FAILURE || code === DEADLOCK_DETECTED;
  }

  private async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await this.knex.transaction(async trx => {
        this.activeTransaction = trx;
        await PostgresTransactionManager.setTenant(trx, this.tenantId);
        return callback();
      });
    } finally {
      this.activeTransaction = undefined;
    }
  }

  private async runWithRetry<T>(callback: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await this.runInTransaction(callback);
    } catch (error) {
      if (PostgresTransactionManager.shouldRetry(error, retries)) {
        this.logger.debug(String(error));
        await this.executeOnRetryHandlers();
        return this.runWithRetry(callback, retries - 1);
      }

      throw error;
    }
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    this.validateState();
    this.clearRunHandlers();

    try {
      const returnValue = await this.runWithRetry(callback);
      await this.executeOnCommitHandlers(returnValue);
      return returnValue;
    } finally {
      this.clearRunHandlers();
      this.activeTransaction = undefined;
    }
  }

  runHandlingOnCommitted<T>(callback: () => Promise<T>) {
    return {
      onCommitted: async (handler: (returnValue: T) => Promise<void>) =>
        this.run(async () => {
          const returnValue = await callback();
          this.runOnCommitHandlers.push(async () => handler(returnValue));
          return returnValue;
        }),
    };
  }

  isRunning(): boolean {
    return !!this.activeTransaction;
  }

  onCommitted(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnCommitHandlers.push(handler);
    } else {
      this.persistentOnCommitHandlers.push(handler);
    }
    return this;
  }

  onRetry(handler: () => Promise<void>) {
    if (this.isRunning()) {
      this.runOnRetryHandlers.push(handler);
    } else {
      this.persistentOnRetryHandlers.push(handler);
    }
    return this;
  }
}
