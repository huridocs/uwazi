import RedisSMQ from 'rsmq';
import { Job } from '../contracts/Job';
import { QueueProvider } from '../contracts/QueueProvider';

interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: () => Partial<T>;
}

export class Queue implements QueueProvider {
  private queueName: string;

  private client: RedisSMQ;

  private definitions: Record<string, Definition<any>> = {};

  constructor(queueName: string, client: RedisSMQ) {
    this.queueName = queueName;
    this.client = client;
  }

  // eslint-disable-next-line class-methods-use-this
  private serializeJob(job: Job) {
    return JSON.stringify({ name: job.constructor.name, data: job });
  }

  private deserializeJob(serialized: string) {
    const data = JSON.parse(serialized);

    const definition = this.definitions[data.name];

    if (!definition) {
      throw new Error('Unregistered job');
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

  async push(job: Job): Promise<void> {
    await this.client.sendMessageAsync({
      qname: this.queueName,
      message: this.serializeJob(job),
    });
  }

  async pop() {
    const message = await this.client.receiveMessageAsync({ qname: this.queueName });
    if ('id' in message) {
      return this.deserializeJob(message.message);
    }

    return null;
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
