import { config } from '#api/config.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  DispatchableClass,
  JobsDispatcher,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NamespacedDispatcher } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';

interface DispatcherFactory {
  (name: string): NamespacedDispatcher;
}

export class JobsRouter implements JobsDispatcher {
  private dispatcherFactory: DispatcherFactory;

  constructor(dispatcherFactory: DispatcherFactory) {
    this.dispatcherFactory = dispatcherFactory;
  }

  async deleteByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    const dispatcher = this.routeJob();
    return dispatcher.deleteByParams(dispatchable, params);
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
