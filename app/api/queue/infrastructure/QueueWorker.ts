/* eslint-disable no-await-in-loop */
import { Job } from '../contracts/Job';
import { Queue } from './Queue';

interface WorkerOptions {
  waitTime?: number;
}

const optionsDefaults: Required<WorkerOptions> = {
  waitTime: 1000,
};

export class QueueWorker {
  private queue: Queue;

  private options: Required<WorkerOptions>;

  private stoppedCallback?: Function;

  constructor(queue: Queue, options: WorkerOptions = {}) {
    this.queue = queue;
    this.options = { ...optionsDefaults, ...options };
  }

  private async sleep() {
    return new Promise(resolve => {
      setTimeout(resolve, this.options.waitTime);
    });
  }

  private async pickJob() {
    let job = await this.queue.pop();

    while (!this.isStopping() && !job) {
      await this.sleep();

      job = await this.queue.pop();
    }

    return job;
  }

  private async handleJob(job: Job) {
    await job.handle();
  }

  async start() {
    let job = await this.pickJob();
    while (job) {
      await this.handleJob(job);
      job = await this.pickJob();
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
}
