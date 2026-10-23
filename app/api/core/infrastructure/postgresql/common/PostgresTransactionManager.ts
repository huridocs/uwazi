import { ClientSession } from 'mongodb';
import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';
import { PermissionContext, PostgresSessionContext } from './PostgresSessionContext.js';
import { TransactionJoinLock } from './TransactionJoinLock.js';
import { TransactionBorrows } from './TransactionBorrows.js';

type CommitHandler = (returnValue: unknown) => Promise<void>;
type RetryHandler = () => Promise<void>;

const SERIALIZATION_FAILURE = '40001';
const DEADLOCK_DETECTED = '40P01';

export interface TransactionHandle {
  trx: Knex.Transaction;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export class PostgresTransactionManager implements TransactionManager {
  private knex: Knex;
  private logger: Logger;
  private activeTransaction?: Knex.Transaction;
  private activeIsReadOnly = false;
  private joinLock = new TransactionJoinLock();
  private borrows = new TransactionBorrows();
  private persistentOnCommitHandlers: CommitHandler[] = [];
  private persistentOnRetryHandlers: RetryHandler[] = [];
  private runOnCommitHandlers: CommitHandler[] = [];
  private runOnRetryHandlers: RetryHandler[] = [];
  private sessionContext: PostgresSessionContext;

  constructor(knex: Knex, tenantId: string, logger: Logger) {
    this.knex = knex;
    this.logger = logger;
    this.sessionContext = new PostgresSessionContext(tenantId);
  }

  /** Opens a transaction, or reuses the active `run()` one (no-op commit/rollback). */
  async beginTransaction(permissionContext?: PermissionContext): Promise<TransactionHandle> {
    const active = this.activeTransaction;
    return active
      ? this.reuseActiveTransaction(active, permissionContext)
      : this.openTransaction(permissionContext);
  }

  private async reuseActiveTransaction(
    trx: Knex.Transaction,
    permissionContext?: PermissionContext
  ): Promise<TransactionHandle> {
    const { saved, endJoin } = await this.prepareJoinedTransaction(trx, permissionContext);
    const restore = async () => {
      try {
        if (!trx.isCompleted()) await this.sessionContext.switch(trx, saved);
      } finally {
        endJoin();
      }
    };
    return { trx, commit: restore, rollback: restore };
  }

  private async prepareJoinedTransaction(
    trx: Knex.Transaction,
    permissionContext?: PermissionContext
  ): Promise<{ saved: PermissionContext; endJoin: () => void }> {
    const endJoin = this.borrows.begin();
    try {
      const saved = this.sessionContext.current(trx);
      await this.sessionContext.switch(trx, permissionContext);
      return { saved, endJoin };
    } catch (error) {
      endJoin();
      throw error;
    }
  }

  private async openTransaction(
    permissionContext?: PermissionContext,
    config: Knex.TransactionConfig = {}
  ): Promise<TransactionHandle> {
    const trx = await this.knex.transaction(config);
    try {
      await this.sessionContext.open(trx, permissionContext);
    } catch (error) {
      await trx.rollback().catch(() => undefined);
      throw error;
    }
    return {
      trx,
      commit: async () => trx.commit().then(() => undefined),
      rollback: async () => trx.rollback().then(() => undefined),
    };
  }

  /** Runs `fn` in a tenant-scoped transaction, joining the active `run()` one when open. */
  async withConnection<T>(
    fn: (executor: Knex.Transaction) => Promise<T>,
    permissionContext?: PermissionContext,
    options?: { preservePermission?: boolean }
  ): Promise<T> {
    if (this.activeTransaction) {
      return this.joinActiveTransaction(fn, permissionContext, options);
    }

    const handle = await this.beginTransaction(permissionContext);
    try {
      const result = await fn(handle.trx);
      await handle.commit();
      return result;
    } catch (error) {
      await handle.rollback().catch(() => undefined);
      throw error;
    }
  }

  private async joinActiveTransaction<T>(
    fn: (executor: Knex.Transaction) => Promise<T>,
    permissionContext: PermissionContext | undefined,
    options: { preservePermission?: boolean } | undefined
  ): Promise<T> {
    const trx = this.activeTransaction;
    if (!trx) throw new Error('PostgresTransactionManager has no active transaction');
    const endJoin = this.borrows.begin();
    try {
      return await this.joinLock.run(async nested => {
        const outer = this.sessionContext.current(trx);
        if (!options?.preservePermission) {
          await this.sessionContext.switch(trx, permissionContext);
        }
        const result = await fn(trx);
        if (nested) await this.sessionContext.switch(trx, outer);
        return result;
      });
    } finally {
      endJoin();
    }
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
    this.runOnCommitHandlers = [];
    this.runOnRetryHandlers = [];
  }

  private validateState() {
    if (this.activeTransaction) throw new Error('Transaction already in progress.');
  }

  private static shouldRetry(error: unknown, retries: number): boolean {
    if (retries <= 0) return false;
    const code = (error as { code?: string })?.code;
    return code === SERIALIZATION_FAILURE || code === DEADLOCK_DETECTED;
  }

  private async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    const handle = await this.beginTransaction();
    this.activeTransaction = handle.trx;
    try {
      const result = await callback();
      await this.finishCommit(handle);
      return result;
    } catch (error) {
      await this.finishRollback(handle);
      throw error;
    }
  }

  private async finishCommit(handle: TransactionHandle): Promise<void> {
    this.activeTransaction = undefined;
    this.activeIsReadOnly = false;
    await this.borrows.drain();
    await handle.commit();
  }

  private async finishRollback(handle: TransactionHandle): Promise<void> {
    this.activeTransaction = undefined;
    this.activeIsReadOnly = false;
    await this.borrows.drain();
    await handle.rollback().catch(() => undefined);
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

  /**
   * Runs `callback` in one read only transaction that every connection inside it joins, instead
   * of each opening its own. Joins a running transaction when there is one. It is not a write
   * transaction: `isRunning()` stays false, and there are no retries nor commit handlers.
   */
  async runReadOnly<T>(callback: () => Promise<T>): Promise<T> {
    if (this.activeTransaction) return callback();
    const handle = await this.openTransaction(undefined, { readOnly: true });
    this.activeTransaction = handle.trx;
    this.activeIsReadOnly = true;
    try {
      const result = await callback();
      await this.finishCommit(handle);
      return result;
    } catch (error) {
      await this.finishRollback(handle);
      throw error;
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
    return !!this.activeTransaction && !this.activeIsReadOnly;
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

  /** Migration bridge: Mongo-backed sources expect a session; Postgres has none. */
  // eslint-disable-next-line class-methods-use-this
  getSession(): ClientSession | undefined {
    return undefined;
  }
}
