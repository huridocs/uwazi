import { ClientSession } from 'mongodb';
import { Knex } from 'knex';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '../../../application/contracts/TransactionManager.js';

type CommitHandler = (returnValue: unknown) => Promise<void>;
type RetryHandler = () => Promise<void>;
type PermissionContext = { bypass: boolean; refIds: string[] };

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
  private pendingJoins = 0;
  private joinsDrain?: { promise: Promise<void>; resolve: () => void };
  private persistentOnCommitHandlers: CommitHandler[] = [];
  private persistentOnRetryHandlers: RetryHandler[] = [];
  private runOnCommitHandlers: CommitHandler[] = [];
  private runOnRetryHandlers: RetryHandler[] = [];

  constructor(knex: Knex, tenantId: string, logger: Logger) {
    this.knex = knex;
    this.tenantId = tenantId;
    this.logger = logger;
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
        if (!trx.isCompleted()) await this.setPermissionVars(trx, saved);
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
    const endJoin = this.beginJoin();
    try {
      await this.setTenant(trx);
      const saved = await this.getPermissionVars(trx);
      await this.setPermissionVars(trx, permissionContext);
      return { saved, endJoin };
    } catch (error) {
      endJoin();
      throw error;
    }
  }

  private async openTransaction(permissionContext?: PermissionContext): Promise<TransactionHandle> {
    const trx = await this.knex.transaction();
    try {
      await this.setTenant(trx);
      await this.setPermissionVars(trx, permissionContext);
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
    const endJoin = this.beginJoin();
    try {
      await this.setTenant(trx);
      if (!options?.preservePermission) {
        await this.setPermissionVars(trx, permissionContext);
      }
      return await fn(trx);
    } finally {
      endJoin();
    }
  }

  /** Marks the start of a transaction borrow; call the returned function when the borrow ends. */
  private beginJoin(): () => void {
    this.pendingJoins += 1;
    return () => {
      this.pendingJoins -= 1;
      if (this.pendingJoins === 0) {
        this.joinsDrain?.resolve();
        this.joinsDrain = undefined;
      }
    };
  }

  /** Resolves when every transaction borrow has been released. */
  private async drainJoins(): Promise<void> {
    if (this.pendingJoins === 0) return;
    if (!this.joinsDrain) {
      let resolve!: () => void;
      this.joinsDrain = {
        promise: new Promise<void>(r => {
          resolve = r;
        }),
        resolve,
      };
    }
    await this.joinsDrain.promise;
  }

  private async setTenant(trx: Knex.Transaction): Promise<void> {
    await trx.raw("SELECT set_config('app.current_tenant', ?, true)", [this.tenantId]);
  }

  private async setPermissionVars(trx: Knex.Transaction, permissionContext?: PermissionContext) {
    const { bypass = false, refIds = [] } = permissionContext ?? {};
    await trx.raw("SELECT set_config('uwazi.bypass_rls', ?, true)", [String(bypass)]);
    await trx.raw("SELECT set_config('uwazi.ref_ids', ?, true)", [refIds.join(',')]);
  }

  private async getPermissionVars(trx: Knex.Transaction): Promise<PermissionContext> {
    const [row] = (
      await trx.raw(
        "SELECT current_setting('uwazi.bypass_rls', true) AS bypass, current_setting('uwazi.ref_ids', true) AS ref_ids"
      )
    ).rows;
    return {
      bypass: row.bypass === 'true',
      refIds: row.ref_ids ? row.ref_ids.split(',').filter(Boolean) : [],
    };
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
    await this.drainJoins();
    await handle.commit();
  }

  private async finishRollback(handle: TransactionHandle): Promise<void> {
    this.activeTransaction = undefined;
    await this.drainJoins();
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

  /** Migration bridge: Mongo-backed sources expect a session; Postgres has none. */
  // eslint-disable-next-line class-methods-use-this
  getSession(): ClientSession | undefined {
    return undefined;
  }
}
