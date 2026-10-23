import { AsyncLocalStorage } from 'async_hooks';

/**
 * Serializes the work joined onto a shared transaction. Each join switches the permission context
 * of the one connection the transaction holds, so two joins left to interleave can run a query
 * under the other's context. A join started from inside another one already holds the lock and
 * runs straight away, or it would wait on itself.
 */
export class TransactionJoinLock {
  /**
   * The lock the current async chain holds. One storage for every lock: each AsyncLocalStorage
   * stays registered once used and taxes every async operation in the process, so one per lock
   * (one per request) piles up.
   */
  private static held = new AsyncLocalStorage<TransactionJoinLock>();

  private tail: Promise<void> = Promise.resolve();

  async run<T>(fn: (nested: boolean) => Promise<T>): Promise<T> {
    if (TransactionJoinLock.held.getStore() === this) return fn(true);

    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>(resolve => {
      release = resolve;
    });

    await previous;
    try {
      return await TransactionJoinLock.held.run(this, async () => fn(false));
    } finally {
      release();
    }
  }
}
