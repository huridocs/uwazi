import { config } from 'api/config';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { Dispatchable } from '../application/contracts/Dispatchable';
import { Queue } from './Queue';

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

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void> {
    const queue = this.routeJob();
    return queue.dispatch(dispatchable, params);
  }
}
