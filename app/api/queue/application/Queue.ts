import { Job } from '../contracts/Job';
import { JobsDispatcher } from '../contracts/JobsDispatcher';
import { QueueAdapter } from '../contracts/QueueAdapter';
import { JobSerializer, NamespaceFactory } from './JobSerializer';

interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: (namespace: string) => Promise<Partial<T>>;
}

interface QueueOptions {
  lockWindow?: number;
  namespaceFactory?: NamespaceFactory;
}

const optionsDefaults: Required<QueueOptions> = {
  lockWindow: 1000,
  namespaceFactory: async () => Promise.resolve(''),
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
    return this.serializer.serialize(job, this.options.namespaceFactory);
  }

  private async deserializeJob(id: string, serialized: string) {
    return this.serializer.deserialize(id, serialized, this.definitions);
  }

  async dispatch(job: Job): Promise<void> {
    await this.adapter.sendMessageAsync({
      qname: this.queueName,
      message: await this.serializeJob(job),
    });
  }

  async peek() {
    const message = await this.adapter.receiveMessageAsync({ qname: this.queueName });
    if ('id' in message) {
      return this.deserializeJob(message.id, message.message);
    }

    return null;
  }

  async complete(job: Job) {
    await this.adapter.deleteMessageAsync({ qname: this.queueName, id: job.id! });
  }

  async progress(job: Job) {
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
