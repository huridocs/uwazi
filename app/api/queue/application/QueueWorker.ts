/* eslint-disable no-await-in-loop */
import { DeliveryGuarantee, Job } from '../contracts/Job';
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
    let job = await this.queue.peek();

    while (!this.isStopping() && !job) {
      await this.sleep();

      job = await this.queue.peek();
    }

    return job;
  }

  private async processAtLeastOnce(job: Job) {
    const heartbeatCallback = async () => this.queue.progress(job);

    await job.handle(heartbeatCallback);
    await this.queue.complete(job);
  }

  private async processJob(job: Job) {
    switch (job.deliveryGuarantee) {
      case DeliveryGuarantee.AtLeastOnce:
      default:
        return this.processAtLeastOnce(job);
    }
  }

  async start() {
    let job = await this.pickJob();
    while (job) {
      await this.processJob(job);
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
