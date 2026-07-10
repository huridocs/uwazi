import { Dispatchable } from '../application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
  JobsDispatcher,
} from '../application/contracts/JobsDispatcher.js';
import { UnregisteredJobError } from './errors.js';

type JobFactory = (namespace: string) => Promise<Dispatchable>;

type JobRegistry = {
  [name: string]: JobFactory;
};

export class SyncJobsDispatcher implements JobsDispatcher {
  constructor(private registry: JobRegistry) {}

  async deleteByParams<T extends Dispatchable>(
    _dispatchable: DispatchableClass<T>,
    _params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    // Sync dispatch executes jobs immediately; there are no persisted jobs to delete.
  }

  async cancelByParams<T extends Dispatchable>(
    _dispatchable: DispatchableClass<T>,
    _params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    // Sync dispatch executes jobs immediately; there are no persisted jobs to cancel.
  }

  // eslint-disable-next-line class-methods-use-this
  async countByName<T extends Dispatchable>(_dispatchable: DispatchableClass<T>): Promise<number> {
    // Sync dispatch executes jobs immediately; there are no persisted jobs.
    return 0;
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    _options?: DispatchOptions
  ): Promise<void> {
    const factory = this.registry[dispatchable.name];

    if (!factory) {
      throw new UnregisteredJobError(dispatchable.name);
    }

    const job = await factory('system');

    await job.handleDispatch(async () => {}, params, {
      retryCount: 0,
      maxRetries: 0,
      namespace: 'system',
    });
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ) => void
    ) => void | Promise<void>
  ): Promise<void> {
    const jobs: Array<{ name: string; params: any; options?: DispatchOptions }> = [];

    const collect = <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1],
      options?: DispatchOptions
    ) => {
      jobs.push({ name: dispatchable.name, params, options });
    };

    await callback(collect);

    for (const jobData of jobs) {
      const factory = this.registry[jobData.name];
      if (!factory) {
        throw new UnregisteredJobError(jobData.name);
      }

      // eslint-disable-next-line no-await-in-loop
      const job = await factory('system');
      // eslint-disable-next-line no-await-in-loop
      await job.handleDispatch(async () => {}, jobData.params, {
        retryCount: 0,
        maxRetries: 0,
        namespace: 'system',
      });
    }
  }
}

export type { JobRegistry };
