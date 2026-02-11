type Time = {
  start: number;
  end?: number;
  duration: () => number;
};

class TelemetryCollector {
  private metadata: Record<string, any>;

  private time: Map<string, Time>;

  private mainOperation: string;

  constructor(mainOperation: string) {
    this.time = new Map<string, Time>();
    this.metadata = {};
    this.mainOperation = mainOperation;
    this.timeStart(mainOperation);
  }

  add(metadata: Record<string, any>) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  timeStart(operationName: string) {
    if (this.time.has(operationName)) {
      throw new Error(`Timer for ${operationName} has already been started`);
    }

    const time: Time = {
      start: Date.now(),
      duration: () => (time.end ?? Date.now()) - time.start,
    };

    this.time.set(operationName, time);
  }

  timeEnd(operationName: string) {
    const timeEntry = this.time.get(operationName);

    if (!timeEntry) {
      throw new Error(`Timer for ${operationName} was not started`);
    }

    if (timeEntry.end) {
      throw new Error(`Timer for ${operationName} has already been ended`);
    }

    timeEntry.end = Date.now();
  }

  build() {
    const mainTime = this.time.get(this.mainOperation)!;

    const timings = Array.from(this.time.entries())
      .filter(([operation]) => operation !== this.mainOperation)
      .sort(([, a], [, b]) => a.start - b.start)
      .map(([operation, timeEntry], index) => ({
        operation,
        duration_ms: timeEntry.duration(),
        order: index,
      }));

    return {
      ...this.metadata,
      timings,
      summary: {
        main_operation: this.mainOperation,
        total_duration_ms: mainTime.duration(),
      },
    };
  }
}

export { TelemetryCollector };
