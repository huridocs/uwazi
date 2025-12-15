import { config } from 'api/config';
import { DispatchableClass, JobsDispatcher } from '../application/contracts/JobsDispatcher';
import { Dispatchable, Params } from '../application/contracts/Dispatchable';
import { NamespacedDispatcher } from './NamespacedDispatcher';

interface DispatcherFactory {
  (name: string): NamespacedDispatcher;
}

export class JobsRouter implements JobsDispatcher {
  private dispatcherFactory: DispatcherFactory;

  constructor(dispatcherFactory: DispatcherFactory) {
    this.dispatcherFactory = dispatcherFactory;
  }

  async deleteByParams<JobParams extends Params>(params: Partial<JobParams>): Promise<void> {
    const dispatcher = this.routeJob();

    return dispatcher.deleteByParams(params);
  }

  private routeJob() {
    const { queueName } = config;
    return this.dispatcherFactory(queueName);
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1]
  ): Promise<void> {
    const dispatcher = this.routeJob();
    return dispatcher.dispatch(dispatchable, params);
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1]
      ) => void
    ) => Promise<void>
  ): Promise<void> {
    const dispatcher = this.routeJob();
    await dispatcher.dispatchMany(callback);
  }
}
