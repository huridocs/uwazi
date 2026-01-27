class LogBuilder {
  private fields: Record<string, any> = {};

  private timers: Record<string, number> = {};

  private timings: Record<string, number> = {};

  constructor() {}

  add(fields: Record<string, any>) {
    this.fields = { ...this.fields, ...fields };
  }

  timeStart(operationName: string) {
    this.timers[operationName] = Date.now();
  }

  timeEnd(operationName: string) {
    const startTime = this.timers[operationName];
    if (startTime) {
      this.timings[`${operationName}_ms`] = Date.now() - startTime;

      delete this.timers[operationName];
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
    this.timeStart(operationName);
    let called = false;
    return () => {
      if (!called) {
        this.timeEnd(operationName);
        called = true;
      }
    };
  }

  build() {
    const enriched = Object.entries(this.timings).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: `${value}ms - ${((value / this.timings.request_ms) * 100).toFixed(2)}%`,
      }),
      {}
    );

    return { ...this.fields, ...enriched };
  }
}

export { LogBuilder };
export { TimedMethod } from './decorators';
