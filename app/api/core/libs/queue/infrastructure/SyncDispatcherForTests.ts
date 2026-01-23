import { tenants } from '#api/tenants/index.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  JobsDispatcher,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Job } from '#api/core/libs/queue/infrastructure/QueueAdapter.js';

interface QueueOptions {
  lockWindow?: number;
  maxRetries?: number;
}

interface Registry {
  [name: string]: () => Promise<Dispatchable>;
}

export class SyncDispatcherForTests implements JobsDispatcher {
  private registry: Registry = {};

  constructor(jobRegistry: Registry) {
    this.registry = jobRegistry;
  }

  // eslint-disable-next-line class-methods-use-this
  async deleteByParams<T extends Dispatchable>(
    _dispatchable: DispatchableClass<T>,
    _params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {}

  // eslint-disable-next-line class-methods-use-this
  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void> {
    const job = await this.registry[dispatchable.name]();
    // eslint-disable-next-line no-empty-function
    await job.handleDispatch(async () => {}, params, {
      retryCount: 0,
      maxRetries: 0,
      namespace: tenants.current().name,
    });
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1]
      ) => void
    ) => Promise<void>
  ): Promise<void> {
    const jobsData: Omit<Job, 'id' | 'lockedUntil' | 'createdAt' | 'retryCount'>[] = [];
    const dispatch = async <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1]
    ) => {
      jobsData.push({
        queue: tenants.current().name,
        namespace: 'sync_queue',
        name: dispatchable.name,
        params,
        options: {
          lockWindow: 0,
          maxRetries: 0,
        },
      });
    };

    await callback(dispatch);

    await jobsData.reduce(async (prev, jobData) => {
      await prev;
      const job = await this.registry[jobData.name]();
      // eslint-disable-next-line no-empty-function
      await job.handleDispatch(async () => {}, jobData.params, {
        retryCount: 0,
        maxRetries: 0,
        namespace: tenants.current().name,
      });
    }, Promise.resolve());
  }
}

export type { QueueOptions };
