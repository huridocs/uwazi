import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { QueueAdapter } from '../infrastructure/QueueAdapter';

interface QueueOptions {
  lockWindow?: number;
  namespace?: string;
}

const optionsDefaults: Required<QueueOptions> = {
  lockWindow: 1000,
  namespace: '',
};

export class Queue implements JobsDispatcher {
  private queueName: string;

  private adapter: QueueAdapter;

  private options: Required<QueueOptions>;

  constructor(queueName: string, adapter: QueueAdapter, options: QueueOptions = {}) {
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
    if (!this.options.namespace) {
      throw new Error('Cannot dispatch without a namespace');
    }

    await this.adapter.pushJob({
      queue: this.queueName,
      name: dispatchable.name,
      params,
      namespace: this.options.namespace,
      options: {
        lockWindow: this.options.lockWindow,
      },
    });
  }
}
