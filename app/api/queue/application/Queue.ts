import { Job } from '../contracts/Job';
import { JobsDispatcher } from '../contracts/JobsDispatcher';
import { QueueAdapter } from '../contracts/QueueAdapter';

interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: (namespace: string) => Promise<Partial<T>>;
}

interface QueueOptions {
  lockWindow?: number;
  namespaceFactory?: (job: Job) => Promise<string>;
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

  constructor(queueName: string, adapter: QueueAdapter, options: QueueOptions = {}) {
    this.queueName = queueName;
    this.adapter = adapter;
    this.options = {
      ...optionsDefaults,
      ...options,
    };
  }

  private async serializeJob(job: Job) {
    return JSON.stringify({
      name: job.constructor.name,
      namespace: await this.options.namespaceFactory(job),
      data: job,
    });
  }

  private async deserializeJob(id: string, serialized: string) {
    const data = JSON.parse(serialized);

    const definition = this.definitions[data.name];

    if (!definition) {
      throw new Error(`Unregistered job ${data.name} in queue ${this.queueName}`);
    }

    const propertyDefinitions = Object.keys(data.data).reduce(
      (properties, property) => ({
        ...properties,
        [property]: {
          ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, property),
          value: data.data[property],
        },
      }),
      {}
    );

    const builtDependencies = await definition.dependenciesFactory?.(data.namespace);

    const dependenciesDefinitions = builtDependencies
      ? Object.keys(builtDependencies).reduce(
          (properties, property) => ({
            ...properties,
            [property]: {
              ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, property),
              value: builtDependencies[property] as any,
            },
          }),
          {}
        )
      : {};

    const managedFieldsDefinition = {
      id: {
        ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, 'id'),
        value: id,
      },
      namespace: {
        ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, 'namespace'),
        value: data.namespace,
      },
    };

    return Object.create(definition.constructorFn.prototype, {
      ...propertyDefinitions,
      ...dependenciesDefinitions,
      ...managedFieldsDefinition,
    }) as Job;
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
