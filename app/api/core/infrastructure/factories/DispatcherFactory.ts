import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';

class DispatcherFactory {
  /** The application-facing Dispatcher, over the context's JobsDispatcher unless one is given. */
  static default(jobsDispatcher: JobsDispatcher = ExecutionContext.jobsDispatcher): Dispatcher {
    return new DispatcherAdapter(jobsDispatcher);
  }
}

export { DispatcherFactory };
