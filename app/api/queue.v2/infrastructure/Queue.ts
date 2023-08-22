import { QueueMessage } from 'rsmq';
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { QueueAdapter } from '../infrastructure/QueueAdapter';

function isMessage(message: {} | QueueMessage): message is QueueMessage {
  return 'id' in message;
}

interface QueueOptions {
  lockWindow?: number;
  namespace?: string;
}

const optionsDefaults: Required<QueueOptions> = {
  lockWindow: 1,
  namespace: '',
};

export interface Job {
  id: string;
  name: string;
  params: any;
  namespace: string;
}

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
    await this.adapter.pushJob(
      this.queueName,
      JSON.stringify({
        name: dispatchable.name,
        params,
        namespace: this.options.namespace,
      })
    );
  }

  async peek() {
    const message = await this.adapter.pickJob(this.queueName);
    if (isMessage(message)) {
      const deserialized = JSON.parse(message.message);

      return {
        id: message.id,
        name: deserialized.name,
        params: deserialized.params,
        namespace: deserialized.namespace,
      };
    }

    return null;
  }

  async complete(job: Job) {
    await this.adapter.completeJob(job.id);
  }

  async progress(job: Job) {
    await this.adapter.renewJobLock(job.id!, this.options.lockWindow);
  }
}
