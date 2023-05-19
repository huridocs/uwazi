import { Job } from '../contracts/Job';
import { JobsDispatcher } from '../contracts/JobsDispatcher';
import { QueueAdapter } from './QueueAdapter';

interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: () => Partial<T>;
}

export class Queue implements JobsDispatcher {
  private queueName: string;

  private adapter: QueueAdapter;

  private lockWindow: number;

  private definitions: Record<string, Definition<any>> = {};

  constructor(queueName: string, adapter: QueueAdapter, lockWindow?: number) {
    this.queueName = queueName;
    this.adapter = adapter;
    this.lockWindow = lockWindow ?? 1000;
  }

  // eslint-disable-next-line class-methods-use-this
  private serializeJob(job: Job) {
    return JSON.stringify({ name: job.constructor.name, data: job });
  }

  private deserializeJob(serialized: string) {
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

    const builtDependencies = definition.dependenciesFactory?.();

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

    return Object.create(definition.constructorFn.prototype, {
      ...propertyDefinitions,
      ...dependenciesDefinitions,
    }) as Job;
  }

  async dispatch(job: Job): Promise<void> {
    await this.adapter.sendMessageAsync({
      qname: this.queueName,
      message: this.serializeJob(job),
    });
  }

  async peek() {
    const message = await this.adapter.receiveMessageAsync({ qname: this.queueName });
    if ('id' in message) {
      return [message.id, this.deserializeJob(message.message)] as const;
    }

    return null;
  }

  async complete(id: string) {
    await this.adapter.deleteMessageAsync({ qname: this.queueName, id });
  }

  async progress(id: string) {
    await this.adapter.changeMessageVisibilityAsync({
      qname: this.queueName,
      id,
      vt: this.lockWindow,
    });
  }

  register<T extends Job>(
    jobConstructor: JobConstructor<T>,
    dependenciesFactory?: () => Partial<T>
  ) {
    this.definitions[jobConstructor.name] = {
      constructorFn: jobConstructor,
      dependenciesFactory,
    };
  }
}
