/* eslint-disable camelcase */
/* eslint-disable no-return-assign */
type Time = {
  start: number;
  end: number;
  duration: () => number;
  finish: () => void;
};

type EndTimer = () => void;

class TelemetryCollector {
  private metadata: Record<string, any>;

  private time: Map<string, Time[]>;

  private mainOperation: string;

  constructor(mainOperation: string) {
    this.time = new Map<string, Time[]>();
    this.metadata = {};
    this.mainOperation = mainOperation;
    this.startTimer(mainOperation);
  }

  add(metadata: Record<string, any>) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  startTimer(operationName: string): EndTimer {
    if (!this.time.has(operationName)) {
      this.time.set(operationName, []);
    }

    const timers = this.time.get(operationName)!;

    const time: Time = {
      start: Date.now(),
      end: 0,
      duration: () => (time.end || Date.now()) - time.start,
      finish: () => (time.end = Date.now()),
    };

    timers.push(time);

    return () => time.finish();
  }

  build(): Record<string, any> {
    const mainTimer = this.time.get(this.mainOperation)![0];

    const timings = Array.from(this.time.entries())
      .filter(([operation]) => operation !== this.mainOperation)
      .flatMap(([operation, timers]) =>
        timers.map((timer, occurrence) => ({
          operation: timers.length > 1 ? `${operation}[${occurrence}]` : operation,
          duration_ms: timer.duration(),
          start_offset_ms: timer.start - mainTimer.start,
        }))
      )
      .sort((a, b) => a.start_offset_ms - b.start_offset_ms)
      .map(({ start_offset_ms, ...timing }, index) => ({ ...timing, order: index }));

    return {
      ...this.metadata,
      timings,
      summary: {
        main_operation: this.mainOperation,
        total_duration_ms: mainTimer.duration(),
      },
    };
  }
}

export { TelemetryCollector };
