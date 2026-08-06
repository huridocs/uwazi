import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

/**
 * Runs `callback` inside `transactionManager.run()` when no transaction is active.
 * If a transaction is already running on this manager, joins it (no nested run).
 */
export async function runInTransaction<T>(
  transactionManager: TransactionManager,
  callback: () => Promise<T>
): Promise<T> {
  if (transactionManager.isRunning()) {
    return callback();
  }
  return transactionManager.run(callback);
}
