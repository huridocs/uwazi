/* eslint-disable no-await-in-loop */
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass } from '../application/contracts/JobsDispatcher';
import { Job, RedisQueue } from './RedisQueue';

interface WorkerOptions {
  waitTime?: number;
}

const optionsDefaults: Required<WorkerOptions> = {
  waitTime: 1000,
};

interface Registry {
  [name: string]: (namespace: string) => Promise<Dispatchable>;
}

export class QueueWorker {
  private queue: RedisQueue;

  private options: Required<WorkerOptions>;

  private stoppedCallback?: Function;

  private registry: Registry = {};

  constructor(queue: RedisQueue, options: WorkerOptions = {}) {
    this.queue = queue;
    this.options = { ...optionsDefaults, ...options };
  }

  private async sleep() {
    return new Promise(resolve => {
      setTimeout(resolve, this.options.waitTime);
    });
  }

  private async peekJob() {
    let job = await this.queue.peek();

    while (!this.isStopping() && !job) {
      await this.sleep();

      job = await this.queue.peek();
    }

    if (this.isStopping()) return null;

    return job;
  }

  private async processJob(job: Job) {
    const heartbeatCallback = async () => this.queue.progress(job);

    if (!this.registry[job.name]) {
      throw new Error(`Unregistered job ${job.name}`);
    }

    const dispatchable = await this.registry[job.name](job.namespace);

    await dispatchable.handleDispatch(heartbeatCallback, job.params);
    await this.queue.complete(job);
  }

  async start() {
    let job = await this.peekJob();
    while (job) {
      await this.processJob(job);
      job = await this.peekJob();
    }
    this.stopped();
  }

  private isStopping() {
    return !!this.stoppedCallback;
  }

  private stopped() {
    if (this.stoppedCallback) this.stoppedCallback();
  }

  async stop() {
    return new Promise<void>(resolve => {
      this.stoppedCallback = resolve;
    });
  }

  register<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) {
    this.registry[dispatchable.name] = factory;
  }
}
