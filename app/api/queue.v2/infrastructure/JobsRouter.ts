import { config } from 'api/config';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { Dispatchable } from '../application/contracts/Dispatchable';
import { NamespacedDispatcher } from './NamespacedDispatcher';

interface DispactcherFactory {
  (name: string): NamespacedDispatcher;
}

export class JobsRouter implements JobsDispatcher {
  private dispactcherFactory: DispactcherFactory;

  constructor(dispactcherFactory: DispactcherFactory) {
    this.dispactcherFactory = dispactcherFactory;
  }

  private routeJob() {
    const { queueName } = config;
    return this.dispactcherFactory(queueName);
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void> {
    const dispactcher = this.routeJob();
    return dispactcher.dispatch(dispatchable, params);
  }
}
