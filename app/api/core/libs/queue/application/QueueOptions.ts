type JobQueueOptions = {
  lockWindow?: number;
  maxRetries?: number;
  /**
   * Milliseconds after a failure before the job can be picked again. Without it, a failed job
   * waits until the lock of the attempt that failed expires.
   */
  retryDelay?: number;
};

const QUEUE_OPTIONS_MARKER = Symbol('queueOptions');

/**
 * Declares the queue options a job is dispatched with by default. They are applied when the job
 * is inserted, whoever dispatches it; a single dispatch can still override them through
 * DispatchOptions.
 */
function QueueOptions(options: JobQueueOptions) {
  return function decorate<T extends new (...args: any[]) => any>(constructor: T) {
    Object.defineProperty(constructor, QUEUE_OPTIONS_MARKER, {
      value: { ...options },
      writable: false,
      configurable: false,
    });
    return constructor;
  };
}

function queueOptionsOf(dispatchable: Function): JobQueueOptions {
  return (dispatchable as any)[QUEUE_OPTIONS_MARKER] ?? {};
}

export { QueueOptions, queueOptionsOf };
export type { JobQueueOptions };
