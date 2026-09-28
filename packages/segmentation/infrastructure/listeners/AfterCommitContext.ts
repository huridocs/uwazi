import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

/**
 * Listeners on the V1 events bus are called from the emitter's `onCommitted`, once its transaction
 * has finished: the transaction managers of the current execution context are spent, and a
 * dispatcher bound to them cannot join anything. This runs the listener's work in a copy of the
 * context — same tenant, actor and factories — with fresh instances of everything tied to a
 * transaction. The logger and telemetry carry over.
 */
class AfterCommitContext {
  static async run<T>(fn: () => Promise<T>): Promise<T> {
    const store = ExecutionContext.getStore();
    if (!store) {
      return fn();
    }

    const { logger, telemetryCollector } = store.instances ?? {};
    return ExecutionContext.run(
      {
        ...store,
        instances: { ...(logger && { logger }), ...(telemetryCollector && { telemetryCollector }) },
      },
      fn
    );
  }
}

export { AfterCommitContext };
