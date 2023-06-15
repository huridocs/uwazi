import { config } from 'api/config';
import { Queue } from '../application/Queue';
import { Job } from '../contracts/Job';
import { JobsDispatcher } from '../contracts/JobsDispatcher';

interface QueueFactory {
  (name: string): Queue;
}

export class JobsRouter implements JobsDispatcher {
  private queueFactory: QueueFactory;

  constructor(queueFactory: QueueFactory) {
    this.queueFactory = queueFactory;
  }

  private routeJob() {
    const { queueName } = config;
    return this.queueFactory(queueName);
  }

  async dispatch(job: Job): Promise<void> {
    const queue = this.routeJob();
    return queue.dispatch(job);
  }
}
