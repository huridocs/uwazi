import { Job } from '../contracts/Job';
import { JobsDispatcher } from '../contracts/JobsDispatcher';
import { QueueAdapter } from '../contracts/QueueAdapter';
import { JobSerializer } from './JobSerializer';

interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: (namespace: string) => Promise<Partial<T>>;
}

interface QueueOptions {
  lockWindow?: number;
  namespace?: string;
}

const optionsDefaults: Required<QueueOptions> = {
  lockWindow: 1,
  namespace: '',
};

export class Queue implements JobsDispatcher {
  private queueName: string;

  private adapter: QueueAdapter;

  private options: Required<QueueOptions>;

  private definitions: Record<string, Definition<any>> = {};

  private serializer: JobSerializer;

  constructor(
    queueName: string,
    adapter: QueueAdapter,
    serializer: JobSerializer,
    options: QueueOptions = {}
  ) {
    this.queueName = queueName;
    this.adapter = adapter;
    this.serializer = serializer;
    this.options = {
      ...optionsDefaults,
      ...options,
    };
  }

  private async serializeJob(job: Job) {
    return this.serializer.serialize(job, this.options.namespace);
  }

  private async deserializeJob(id: string, serialized: string) {
    return this.serializer.deserialize(id, serialized, this.definitions);
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

  async dispatch(job: Job): Promise<void> {
    await this.ensureQueue();
    await this.adapter.sendMessageAsync({
      qname: this.queueName,
      message: await this.serializeJob(job),
    });
  }

  async peek() {
    await this.ensureQueue();
    const message = await this.adapter.receiveMessageAsync({ qname: this.queueName });
    if ('id' in message) {
      return this.deserializeJob(message.id, message.message);
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
      vt: job.lockWindow ?? this.options.lockWindow,
    });
  }

  register<T extends Job>(
    jobConstructor: JobConstructor<T>,
    dependenciesFactory?: (namespace: string) => Promise<Partial<T>>
  ) {
    this.definitions[jobConstructor.name] = {
      constructorFn: jobConstructor,
      dependenciesFactory,
    };
  }
}
