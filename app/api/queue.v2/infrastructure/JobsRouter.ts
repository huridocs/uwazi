// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
import { config } from '../config.js';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher.js';
import { Dispatchable } from '../application/contracts/Dispatchable.js';
import { NamespacedDispatcher } from './NamespacedDispatcher.js';

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
