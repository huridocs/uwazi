import { Dispatchable } from '../application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
  JobsDispatcher,
} from '../application/contracts/JobsDispatcher.js';
import { JobQueueOptions, queueOptionsOf } from '../application/QueueOptions.js';
import { PushJobInput, QueueAdapter } from './QueueAdapter.js';

const optionsDefaults: Required<JobQueueOptions> = {
  lockWindow: 1000 * 60 * 10,
  maxRetries: 5,
};

const definedOnly = (options: JobQueueOptions): JobQueueOptions =>
  Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

export class NamespacedDispatcher implements JobsDispatcher {
  private namespace: string;

  private queueName: string;

  private adapter: QueueAdapter;

  constructor(namespace: string, queueName: string, adapter: QueueAdapter) {
    this.namespace = namespace;
    this.queueName = queueName;
    this.adapter = adapter;
  }

  async deleteByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    await this.adapter.deleteByParams(dispatchable.name, params, this.namespace);
  }

  async cancelByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    await this.adapter.cancelByParams(dispatchable.name, params, this.namespace);
  }

  async countByName<T extends Dispatchable>(dispatchable: DispatchableClass<T>): Promise<number> {
    return this.adapter.countByName(dispatchable.name, this.namespace);
  }

  // eslint-disable-next-line class-methods-use-this
  private resolveOptions<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    options: DispatchOptions = {}
  ): Required<JobQueueOptions> {
    const { lockWindow, maxRetries } = options;
    return {
      ...optionsDefaults,
      ...definedOnly(queueOptionsOf(dispatchable)),
      ...definedOnly({ lockWindow, maxRetries }),
    };
  }

  private buildJob<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): PushJobInput {
    return {
      queue: this.queueName,
      name: dispatchable.name,
      params,
      namespace: this.namespace,
      options: this.resolveOptions(dispatchable, options),
      ...(options?.lockedUntil !== undefined ? { lockedUntil: options.lockedUntil } : {}),
    };
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    await this.adapter.pushJob(this.buildJob(dispatchable, params, options));
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ) => void
    ) => Promise<void>
  ): Promise<void> {
    const jobs: PushJobInput[] = [];

    const dispatch = <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1],
      options?: DispatchOptions
    ) => {
      jobs.push(this.buildJob(dispatchable, params, options));
    };

    await callback(dispatch);

    if (jobs.length > 0) {
      await this.adapter.pushJobs(jobs);
    }
  }
}
