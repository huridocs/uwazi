/* eslint-disable no-plusplus */
class Semaphore {
  private queue: (() => void)[] = [];

  constructor(private permits: number) {
    if (permits < 1) throw new RangeError('Semaphore permits must be >= 1');
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}

export { Semaphore };
