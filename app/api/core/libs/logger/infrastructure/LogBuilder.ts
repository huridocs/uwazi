class LogBuilder {
  private fields: Record<string, any> = {};

  private timers: Record<string, number> = {};

  private timings: Record<string, number> = {};

  constructor() {}

  add(fields: Record<string, any>) {
    this.fields = { ...this.fields, ...fields };
  }

  time(operationName: string) {
    this.timers[operationName] = Date.now();
  }

  timeEnd(operationName: string) {
    const startTime = this.timers[operationName];
    if (startTime) {
      this.timings[`${operationName}_ms`] = Date.now() - startTime;
      delete this.timers[operationName]; // Clean up to save memory
    }
  }

  /**
   * Automatically times an async operation, ensuring timeEnd is called even if error is thrown
   * @param operationName Name for the timing metric
   * @param fn Async function to execute
   * @returns Result of the async function
   *
   * @example
   * const user = await logBuilder.timeAsync('fetch_user', () => db.users.findOne({ id }));
   */
  async timeAsync<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    this.time(operationName);
    try {
      return await fn();
    } finally {
      this.timeEnd(operationName);
    }
  }

  /**
   * Returns a function that ends the timer when called. Useful for more complex control flows.
   * @param operationName Name for the timing metric
   * @returns Function to call when operation completes
   *
   * @example
   * const endTimer = logBuilder.startTimer('process_data');
   * try {
   *   // ... do work
   * } finally {
   *   endTimer();
   * }
   */
  startTimer(operationName: string): () => void {
    this.time(operationName);
    let called = false;
    return () => {
      if (!called) {
        this.timeEnd(operationName);
        called = true;
      }
    };
  }

  increment(counterName: string, amount: number = 1) {
    this.fields[counterName] = (this.fields[counterName] || 0) + amount;
  }

  error(error: Error | string) {
    this.fields.error = error instanceof Error ? error.message : error;
    if (error instanceof Error && error.stack) {
      this.fields.error_stack = error.stack;
    }
  }

  build() {
    return { ...this.fields, ...this.timings };
  }
}

export { LogBuilder };
export { TimedController, TimeAsync, TimedMethod } from './decorators';
