import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';

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
   * Opens or reuses a transaction and returns a handle the caller MUST
   * explicitly commit or roll back.
   *
   * When a `run()` transaction is already active the handle reuses it and
   * commit/rollback are no-ops — the outer `run()` owns the lifecycle.
   *
   * Otherwise a new knex transaction is opened and the caller is responsible
   * for calling `commit()` or `rollback()` to release it.
   */
  async beginTransaction(permissionContext?: {
    bypass: boolean;
    refIds: string[];
  }): Promise<TransactionHandle> {
    if (this.activeTransaction) {
      await this.setTenant(this.activeTransaction);
      const saved = await this.getPermissionVars(this.activeTransaction);
      await this.setPermissionVars(this.activeTransaction, permissionContext);
      const restore = async () => {
        await this.setPermissionVars(this.activeTransaction!, saved);
      };
      return {
        trx: this.activeTransaction,
        commit: restore,
        rollback: restore,
      };
    }

    const trx = await this.knex.transaction();
    await this.setTenant(trx);
    await this.setPermissionVars(trx, permissionContext);
    return {
      trx,
      commit: async () => {
        await trx.commit();
      },
      rollback: async () => {
        await trx.rollback();
      },
    };
  }

  /**
   * Runs `fn` with a tenant-scoped Knex executor.
   *
   * Case #2 — a `run()` transaction is already active: reuse it so multiple
   * operations share the same transactional scope and tenant GUC.
   *
   * Case #1 — no active transaction: open a short-lived, self-scoped transaction
   * and set `app.current_tenant` for RLS.
   */
  async withConnection<T>(
    fn: (executor: Knex.Transaction) => Promise<T>,
    permissionContext?: { bypass: boolean; refIds: string[] }
  ): Promise<T> {
    if (this.activeTransaction) {
      await this.setTenant(this.activeTransaction);
      await this.setPermissionVars(this.activeTransaction, permissionContext);
      return fn(this.activeTransaction);
    }

    const handle = await this.beginTransaction(permissionContext);
    try {
      const result = await fn(handle.trx);
      await handle.commit();
      return result;
    } catch (error) {
      try {
        await handle.rollback();
      } catch {
        // propagate original error, not rollback error
      }
      throw error;
    }
  }

  private async setTenant(trx: Knex.Transaction): Promise<void> {
    await trx.raw("SELECT set_config('app.current_tenant', ?, true)", [this.tenantId]);
  }

  private async setPermissionVars(
    trx: Knex.Transaction,
    permissionContext?: { bypass: boolean; refIds: string[] }
  ): Promise<void> {
    let bypass = 'false';
    let refIds = '';
    if (permissionContext) {
      bypass = permissionContext.bypass ? 'true' : 'false';
      refIds = permissionContext.refIds.join(',');
    }
    await trx.raw("SELECT set_config('uwazi.bypass_rls', ?, true)", [bypass]);
    await trx.raw("SELECT set_config('uwazi.ref_ids', ?, true)", [refIds]);
  }

  private async getPermissionVars(
    trx: Knex.Transaction
  ): Promise<{ bypass: boolean; refIds: string[] }> {
    const result = await trx.raw(
      "SELECT current_setting('uwazi.bypass_rls', true) AS bypass, current_setting('uwazi.ref_ids', true) AS ref_ids"
    );
    const row = result.rows[0];
    return {
      bypass: row.bypass === 'true',
      refIds: row.ref_ids ? row.ref_ids.split(',').filter(Boolean) : [],
    };
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
    const handle = await this.beginTransaction();
    this.activeTransaction = handle.trx;
    try {
      const result = await callback();
      await handle.commit();
      return result;
    } catch (error) {
      try {
        await handle.rollback();
      } catch {
        // propagate original error, not rollback error
      }
      throw error;
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
