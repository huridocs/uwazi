/* eslint-disable no-await-in-loop */
import { Dispatchable } from '../application/contracts/Dispatchable';
import { DispatchableClass } from '../application/contracts/JobsDispatcher';
import { Job, Queue } from './Queue';
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
  private queue: Queue;

  private logger: (level: 'info' | 'error', message: string | object) => void;

  private options: Required<WorkerOptions>;

  private stoppedCallback?: Function;

  private registry: Registry = {};

  private timesThatSleepped = 0;

  constructor(queue: Queue, logger: (level: 'info' | 'error', message: string | object) => void) {
    this.queue = queue;
    this.options = { ...optionsDefaults };
    this.logger = logger;
  }

  private async sleep() {
    if (!this.timesThatSleepped) {
      this.logger('info', { message: 'Sleeping', waitTime: this.options.waitTime });
      this.timesThatSleepped += 1;
    }

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

    this.logger('info', { message: 'Resumed', timesThatSleepped: this.timesThatSleepped });
    this.timesThatSleepped = 0;
    return job;
  }

  private async createDispatchable(job: Job) {
    if (!this.registry[job.name]) {
      throw new UnregisteredJobError(job.name);
    }

    return this.registry[job.name](job.namespace);
  }

  private async processJob(job: Job) {
    const dispatchable = await this.createDispatchable(job);
    const heartbeatCallback = async () => this.queue.progress(job);

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
