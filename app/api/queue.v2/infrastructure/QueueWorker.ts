/* eslint-disable no-await-in-loop */
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass } from '../application/contracts/JobsDispatcher';
import { Job, RedisQueue } from './RedisQueue';
import { UnregisteredJobError } from './errors';

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

  private logger: (level: 'info' | 'error', message: string | object) => void;

  private options: Required<WorkerOptions>;

  private stoppedCallback?: Function;

  private registry: Registry = {};

  constructor(
    queue: RedisQueue,
    logger: (level: 'info' | 'error', message: string | object) => void
  ) {
    this.queue = queue;
    this.options = { ...optionsDefaults };
    this.logger = logger;
  }

  private async sleep() {
    this.logger('info', { message: 'Sleeping', waitTime: this.options.waitTime });
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
      throw new UnregisteredJobError(job.name);
    }

    const dispatchable = await this.registry[job.name](job.namespace);

    try {
      this.logger('info', { message: 'Processing job', ...job });
      await dispatchable.handleDispatch(heartbeatCallback, job.params);
      this.logger('info', { message: 'Processed job', ...job });
      await this.queue.complete(job);
    } catch (e) {
      this.logger('error', {
        name: e.name,
        message: e.message,
        stack: e.stack,
        job,
      });
    }
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

  getRegisteredJobs() {
    return Object.keys(this.registry);
  }
}
