import { tenants } from '#api/tenants/index.js';
import { Dispatchable } from '../application/contracts/Dispatchable.js';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/application/contracts/SyncDispatcherForTests.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

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
}

export type { QueueOptions };
