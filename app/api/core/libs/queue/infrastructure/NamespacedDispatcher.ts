import { Dispatchable } from '../application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  DispatchOptions,
  JobsDispatcher,
} from '../application/contracts/JobsDispatcher.js';
import { PushJobInput, QueueAdapter } from './QueueAdapter.js';

interface QueueOptions {
  lockWindow?: number;
  maxRetries?: number;
}

const optionsDefaults: Required<QueueOptions> = {
  lockWindow: 1000 * 60 * 10,
  maxRetries: 5,
};

export class NamespacedDispatcher implements JobsDispatcher {
  private namespace: string;

  private queueName: string;

  private adapter: QueueAdapter;

  private options: Required<QueueOptions>;

  constructor(
    namespace: string,
    queueName: string,
    adapter: QueueAdapter,
    options: QueueOptions = {}
  ) {
    this.namespace = namespace;
    this.queueName = queueName;
    this.adapter = adapter;
    this.options = {
      ...optionsDefaults,
      ...options,
    };
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

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    await this.adapter.pushJob({
      queue: this.queueName,
      name: dispatchable.name,
      params,
      namespace: this.namespace,
      options: {
        lockWindow: this.options.lockWindow,
        maxRetries: this.options.maxRetries,
      },
      ...(options?.lockedUntil !== undefined ? { lockedUntil: options.lockedUntil } : {}),
    });
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
      jobs.push({
        queue: this.queueName,
        name: dispatchable.name,
        params,
        namespace: this.namespace,
        options: {
          lockWindow: this.options.lockWindow,
          maxRetries: this.options.maxRetries,
        },
        ...(options?.lockedUntil !== undefined ? { lockedUntil: options.lockedUntil } : {}),
      });
    };

    await callback(dispatch);

    if (jobs.length > 0) {
      await this.adapter.pushJobs(jobs);
    }
  }
}

export type { QueueOptions };
