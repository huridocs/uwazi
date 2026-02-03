import { AsyncLocalStorage } from 'async_hooks';
import { TransactionManager } from '../application/contracts/TransactionManager.js';
import { JobsDispatcher } from './queue/application/contracts/JobsDispatcher.js';
import { IdGenerator } from '../application/contracts/IdGenerator.js';
import { EventEmitter } from './eventEmitter/EventEmitter.js';

type Dependencies = {
  eventEmitter: EventEmitter;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
  idGenerator: IdGenerator;
};

class DependenciesContext extends AsyncLocalStorage<Dependencies> {
  get transactionManager(): TransactionManager {
    if (!this.getStore()?.transactionManager) {
      throw new Error('TransactionManager is not set');
    }

    return this.getStore()!.transactionManager;
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
}

const dependenciesContext = new DependenciesContext();

export { dependenciesContext as DependenciesContext };
