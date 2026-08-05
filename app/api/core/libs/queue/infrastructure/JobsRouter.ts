import { config } from '#api/config.js';
import {
  DispatchableClass,
  DispatchOptions,
  JobsDispatcher,
} from '../application/contracts/JobsDispatcher.js';
import { Dispatchable } from '../application/contracts/Dispatchable.js';
import { NamespacedDispatcher } from './NamespacedDispatcher.js';

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

  async cancelByParams<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Partial<Parameters<T['handleDispatch']>[1]>
  ): Promise<void> {
    const dispatcher = this.routeJob();

    return dispatcher.cancelByParams(dispatchable, params);
  }

  async countByName<T extends Dispatchable>(dispatchable: DispatchableClass<T>): Promise<number> {
    const dispatcher = this.routeJob();
    return dispatcher.countByName(dispatchable);
  }

  private routeJob() {
    const { queueName } = config;
    return this.dispatcherFactory(queueName);
  }

  async dispatch<T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    params: Parameters<T['handleDispatch']>[1],
    options?: DispatchOptions
  ): Promise<void> {
    const dispatcher = this.routeJob();
    return dispatcher.dispatch(dispatchable, params, options);
  }

  async dispatchMany(
    callback: (
      dispatch: <T extends Dispatchable>(
        dispatchable: DispatchableClass<T>,
        params: Parameters<T['handleDispatch']>[1],
        options?: DispatchOptions
      ) => void
    ) => Promise<void>
  ): Promise<void> {
    const dispatcher = this.routeJob();
    await dispatcher.dispatchMany(callback);
  }
}
