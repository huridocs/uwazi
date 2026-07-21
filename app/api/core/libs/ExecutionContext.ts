import { AsyncLocalStorage } from 'async_hooks';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import { User } from '#api/users.v2/model/User.js';
import { TransactionManager } from '../application/contracts/TransactionManager.js';
import { JobsDispatcher } from './queue/application/contracts/JobsDispatcher.js';
import { IdGenerator } from '../application/contracts/IdGenerator.js';
import { EventEmitter } from './eventEmitter/EventEmitter.js';
import { Logger } from './logger/contracts/Logger.js';
import { PostgresTransactionManager } from '../infrastructure/postgresql/common/PostgresTransactionManager.js';

type DependencyFactories = {
  [K in keyof Dependencies]: () => Dependencies[K];
};

type Dependencies = {
  eventEmitter: EventEmitter;
  transactionManager: TransactionManager;
  postgresTransactionManager: PostgresTransactionManager;
  jobsDispatcher: JobsDispatcher;
  idGenerator: IdGenerator;
  logger: Logger;
};

type Context = {
  factories: DependencyFactories;
  instances?: Partial<Dependencies>;
  tenant?: Tenant;
  actor?: User;
};

class ExecutionContext extends AsyncLocalStorage<Context> {
  private getOrInitialize<K extends keyof DependencyFactories>(key: K): Dependencies[K] {
    const store = this.getStore();
    if (!store) {
      throw new Error('ExecutionContext is not initialized');
    }

    if (typeof store.instances === 'undefined') {
      store.instances = {};
    }

    if (!store.instances?.[key]) {
      store.instances[key] = store.factories[key]();
    }

    return store.instances[key]!;
  }

  get transactionManager(): TransactionManager {
    return this.getOrInitialize('transactionManager');
  }

  get postgresTransactionManager(): PostgresTransactionManager {
    return this.getOrInitialize('postgresTransactionManager');
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

  get tenant(): Tenant {
    const store = this.getStore();
    if (!store?.tenant) {
      throw new Error('ExecutionContext: tenant is not set');
    }
    return store.tenant;
  }

  /**
   * Temporary compatibility bridge while legacy code paths are still being
   * migrated from tenants.current() to ExecutionContext.tenant.
   * Once all callers run inside an ExecutionContext, this helper can be removed
   * and factories should use ExecutionContext.tenant directly.
   */
  get currentTenant(): Tenant {
    return this.getStore()?.tenant ?? tenants.current();
  }

  get actor(): User | undefined {
    return this.getStore()?.actor;
  }

  set actor(user: User) {
    const store = this.getStore();
    if (!store) {
      throw new Error('ExecutionContext is not initialized');
    }
    store.actor = user;
  }

  attachContext<T extends Object>(anInstance: T, method: keyof T, deps: Context): void {
    const originalMethod = (anInstance[method] as any).bind(anInstance);

    // eslint-disable-next-line no-param-reassign
    (anInstance[method] as any) = async (...args: any[]) =>
      this.run(deps, async () => originalMethod(...args));
  }

  attachSyncContext<T extends Object>(anInstance: T, method: keyof T, deps: Context): void {
    const originalMethod = (anInstance[method] as any).bind(anInstance);

    // eslint-disable-next-line no-param-reassign
    (anInstance[method] as any) = (...args: any[]) => this.run(deps, () => originalMethod(...args));
  }
}

const executionContext = new ExecutionContext();

export { executionContext as ExecutionContext };
export type { Context as ExecutionContextDeps };
