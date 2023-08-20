import { QueueMessage } from 'rsmq';
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { QueueAdapter } from '../infrastructure/QueueAdapter';

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

export class RedisQueue implements JobsDispatcher {
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

  private async ensureQueue() {
    try {
      await this.adapter.createQueueAsync({ qname: this.queueName, vt: this.options.lockWindow });
    } catch (e) {
      if (e.name !== 'queueExists') {
        throw e;
      }
    }
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void> {
    await this.ensureQueue();
    await this.adapter.sendMessageAsync({
      qname: this.queueName,
      message: JSON.stringify({
        name: dispatchable.name,
        params,
        namespace: this.options.namespace,
      }),
    });
  }

  private isMessage(message: {} | QueueMessage): message is QueueMessage {
    return 'id' in message;
  }

  async peek() {
    await this.ensureQueue();
    const message = await this.adapter.receiveMessageAsync({ qname: this.queueName });
    if (this.isMessage(message)) {
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
    await this.ensureQueue();
    await this.adapter.deleteMessageAsync({ qname: this.queueName, id: job.id! });
  }

  async progress(job: Job) {
    await this.ensureQueue();
    await this.adapter.changeMessageVisibilityAsync({
      qname: this.queueName,
      id: job.id!,
      vt: this.options.lockWindow,
    });
  }
}
