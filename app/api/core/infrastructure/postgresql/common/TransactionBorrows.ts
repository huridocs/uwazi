/** Counts the borrows of a shared transaction still in flight, so it commits only after them. */
export class TransactionBorrows {
  private pending = 0;

  private drained?: { promise: Promise<void>; resolve: () => void };

  /** Marks the start of a borrow; call the returned function when the borrow ends. */
  begin(): () => void {
    this.pending += 1;
    return () => {
      this.pending -= 1;
      if (this.pending === 0) {
        this.drained?.resolve();
        this.drained = undefined;
      }
    };
  }

  /** Resolves when every borrow has been released. */
  async drain(): Promise<void> {
    if (this.pending === 0) return;
    if (!this.drained) {
      let resolve!: () => void;
      this.drained = {
        promise: new Promise<void>(r => {
          resolve = r;
        }),
        resolve,
      };
    }
    await this.drained.promise;
  }
}
