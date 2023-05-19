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

  private async processAtLeastOnce(id: string, job: Job) {
    const heartbeatCallback = async () => this.queue.progress(id);

    await job.handle(heartbeatCallback);
    await this.queue.complete(id);
  }

  private async processJob(id: string, job: Job) {
    switch (job.deliveryGuarantee) {
      case DeliveryGuarantee.AtLeastOnce:
      default:
        return this.processAtLeastOnce(id, job);
    }
  }

  async start() {
    let result = await this.pickJob();
    while (result) {
      const [id, job] = result;
      await this.processJob(id, job);
      result = await this.pickJob();
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
