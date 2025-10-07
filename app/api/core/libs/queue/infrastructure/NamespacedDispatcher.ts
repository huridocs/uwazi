import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { Job, QueueAdapter } from './QueueAdapter';

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

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
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
    const jobs: Omit<Job, 'id' | 'lockedUntil' | 'createdAt' | 'retryCount'>[] = [];

    const dispatch = <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1]
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
      });
    };

    await callback(dispatch);

    if (jobs.length > 0) {
      await this.adapter.pushJobs(jobs);
    }
  }
}

export type { QueueOptions };
