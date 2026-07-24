/* eslint-disable class-methods-use-this */
/* eslint-disable max-statements */
import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';

type Span = {
  id: number;
  operation: string;
  parentId: number | null;
  start: number;
  end: number;
};

class TelemetryCollector {
  private metadata: Record<string, any>;

  private spans: Span[];

  private currentSpan: AsyncLocalStorage<number>;

  private rootSpanId: number;

  constructor(mainOperation: string, startTime: number = performance.now()) {
    this.metadata = {};
    this.spans = [];
    this.currentSpan = new AsyncLocalStorage<number>();
    this.rootSpanId = this.openSpan(mainOperation, null, startTime);
  }

  add(metadata: Record<string, any>) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  mainDurationMs(): number {
    return this.duration(this.spans[this.rootSpanId]);
  }

  runSpan<T>(operation: string, fn: () => T): T {
    const parentId = this.currentSpan.getStore() ?? this.rootSpanId;
    const spanId = this.openSpan(operation, parentId);
    const finishSpan = () => {
      this.spans[spanId].end = performance.now();
    };

    let result: T;
    try {
      result = this.currentSpan.run(spanId, fn);
    } catch (error) {
      finishSpan();
      throw error;
    }

    if (result instanceof Promise) {
      return result.finally(finishSpan) as T;
    }

    finishSpan();
    return result;
  }

  private openSpan(
    operation: string,
    parentId: number | null,
    start: number = performance.now()
  ): number {
    const id = this.spans.length;
    this.spans.push({ id, operation, parentId, start, end: 0 });
    return id;
  }

  private duration(span: Span): number {
    return (span.end || performance.now()) - span.start;
  }

  private buildSpan(span: Span): Record<string, any> {
    const children = this.spans
      .filter(candidate => candidate.parentId === span.id)
      .map(child => this.buildSpan(child));

    return {
      operation: span.operation,
      duration_ms: this.duration(span),
      ...(children.length > 0 && { children }),
    };
  }

  build(): Record<string, any> {
    const root = this.spans[this.rootSpanId];

    return {
      ...this.metadata,
      timings: this.buildSpan(root).children || [],
      summary: {
        main_operation: root.operation,
        total_duration_ms: this.duration(root),
      },
    };
  }
}

export { TelemetryCollector };
