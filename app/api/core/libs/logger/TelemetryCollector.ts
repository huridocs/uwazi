type Time = {
  start: number;
  end?: number;
  duration: () => number;
};

class TelemetryCollector {
  private metadata: Record<string, any>;

  private mainProcess: string;

  private time: Map<string, Time>;

  constructor(mainProcess: string) {
    this.mainProcess = mainProcess;
    this.time = new Map<string, Time>();
    this.metadata = {};
    this.timeStart(mainProcess);
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
    const enriched: Record<string, any> = {};
    const requestDuration = this.time.get(this.mainProcess)!;

    this.time.forEach((timeEntry, operationName) => {
      enriched[`${operationName}_duration_ms`] = timeEntry.duration();

      // enriched[`${operationName}_duration_percent`] =
      //   `${((timeEntry.duration() / requestDuration.duration()) * 100).toFixed(2)}%`;
    });

    return { ...this.metadata, ...enriched };
  }
}

export { TelemetryCollector };
