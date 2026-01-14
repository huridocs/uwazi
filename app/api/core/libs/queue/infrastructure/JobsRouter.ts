import { config } from '#api/config.js';
import { Dispatchable } from '../application/contracts/Dispatchable.js';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher.js';
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

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1]
      ) => void
    ) => Promise<void>
  ): Promise<void> {
    const dispactcher = this.routeJob();
    await dispactcher.dispatchMany(callback);
  }
}
