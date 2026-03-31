import { AsyncLocalStorage } from 'async_hooks';
import { TransactionManager } from '../application/contracts/TransactionManager.js';
import { JobsDispatcher } from './queue/application/contracts/JobsDispatcher.js';
import { IdGenerator } from '../application/contracts/IdGenerator.js';
import { EventEmitter } from './eventEmitter/EventEmitter.js';
import { Logger } from './logger/contracts/Logger.js';
import { TenantAwareESClient } from '../infrastructure/elasticSearch/TenantAwareESClient.js';
import { AuthorizedEntityESClient } from '../infrastructure/elasticSearch/entities/AuthorizedElasticEntityClient.js';

type DependencyFactories = {
  [K in keyof Dependencies]: () => Dependencies[K];
};

type Dependencies = {
  eventEmitter: EventEmitter;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
  idGenerator: IdGenerator;
  logger: Logger;
  elasticClient: TenantAwareESClient;
  authorizedEntityESClient: AuthorizedEntityESClient;
};

type Context = {
  factories: DependencyFactories;
  instances?: Dependencies;
};

class DependenciesContext extends AsyncLocalStorage<Context> {
  private getOrInitialize<K extends keyof DependencyFactories>(key: K): Dependencies[K] {
    const store = this.getStore();
    if (!store) {
      throw new Error('DependenciesContext is not initialized');
    }

    if (typeof store.instances === 'undefined') {
      store.instances = {} as Dependencies;
    }

    if (!store.instances?.[key]) {
      store.instances[key] = store.factories[key]();
    }

    return store.instances[key]!;
  }

  get transactionManager(): TransactionManager {
    return this.getOrInitialize('transactionManager');
  }

  get elasticClient() {
    return this.getOrInitialize('elasticClient');
  }

  get authorizedEntityESClient() {
    return this.getOrInitialize('authorizedEntityESClient');
  }

  get logger() {
    return this.getOrInitialize('logger');
  }

  get idGenerator(): IdGenerator {
    return this.getOrInitialize('idGenerator');
  }

  get jobsDispatcher(): JobsDispatcher {
    return this.getOrInitialize('jobsDispatcher');
  }

  get eventEmitter(): EventEmitter {
    return this.getOrInitialize('eventEmitter');
  }

  attachContext<T extends Object>(anInstance: T, method: keyof T, deps: Context): void {
    const originalMethod = (anInstance[method] as any).bind(anInstance);

    // eslint-disable-next-line no-param-reassign
    (anInstance[method] as any) = async (...args: any[]) =>
      this.run(deps, async () => originalMethod(...args));
  }
}

const dependenciesContext = new DependenciesContext();

export { dependenciesContext as DependenciesContext };
