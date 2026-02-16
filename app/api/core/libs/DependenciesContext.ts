import { AsyncLocalStorage } from 'async_hooks';
import { TransactionManager } from '../application/contracts/TransactionManager';
import { JobsDispatcher } from './queue/application/contracts/JobsDispatcher';
import { IdGenerator } from '../application/contracts/IdGenerator';
import { EventEmitter } from './eventEmitter/EventEmitter';
import { Logger } from './logger/contracts/Logger';
import { TelemetryCollector } from './logger/TelemetryCollector';

type Deps = {
  eventEmitter: EventEmitter;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
  idGenerator: IdGenerator;
  logger: Logger;
  telemetryCollector?: TelemetryCollector;
};

class DependenciesContext extends AsyncLocalStorage<Deps> {
  get transactionManager(): TransactionManager {
    if (!this.getStore()?.transactionManager) {
      throw new Error('TransactionManager is not set');
    }

    return this.getStore()!.transactionManager;
  }

  getTelemetryCollector(): TelemetryCollector | undefined {
    return this.getStore()?.telemetryCollector;
  }

  get logger(): Logger {
    if (!this.getStore()?.logger) {
      throw new Error('Logger is not set');
    }

    return this.getStore()!.logger;
  }

  get idGenerator(): IdGenerator {
    if (!this.getStore()?.idGenerator) {
      throw new Error('IdGenerator is not set');
    }

    return this.getStore()!.idGenerator;
  }

  get jobsDispatcher(): JobsDispatcher {
    if (!this.getStore()?.jobsDispatcher) {
      throw new Error('JobsDispatcher is not set');
    }

    return this.getStore()!.jobsDispatcher;
  }

  get eventEmitter(): EventEmitter {
    if (!this.getStore()?.eventEmitter) {
      throw new Error('EventEmitter is not set');
    }

    return this.getStore()!.eventEmitter;
  }

  attachContext<T extends Object>(anInstance: T, method: keyof T, deps: Deps): void {
    const originalMethod = (anInstance[method] as any).bind(anInstance);

    // eslint-disable-next-line no-param-reassign
    (anInstance[method] as any) = async (...args: any[]) =>
      this.run(deps, async () => originalMethod(...args));
  }
}

const dependenciesContext = new DependenciesContext();

export { dependenciesContext as DependenciesContext };
export type { Deps as DependenciesContextDeps };
