import { AsyncLocalStorage } from 'async_hooks';
import { TransactionManager } from '../application/contracts/TransactionManager';
import { JobsDispatcher } from './queue/application/contracts/JobsDispatcher';
import { IdGenerator } from '../application/contracts/IdGenerator';
import { EventEmitter } from './eventEmitter/EventEmitter';
import { AbstractUseCase } from './UseCase';

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

  attachContext<T extends AbstractUseCase<any, any, any, any>>(
    useCase: T,
    deps: Dependencies
  ): void {
    const originalExecute = useCase.execute.bind(useCase);

    // eslint-disable-next-line no-param-reassign
    useCase.execute = (async (...args: any[]) =>
      //@ts-ignore
      this.run(deps, async () => originalExecute(...args))) as T['execute'];
  }
}

const dependenciesContext = new DependenciesContext();

export { dependenciesContext as DependenciesContext };
