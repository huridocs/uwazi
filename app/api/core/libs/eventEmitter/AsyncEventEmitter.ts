import { TransactionManager } from '../../application/contracts/TransactionManager.js';
import { JobsDispatcher } from '../queue/application/contracts/JobsDispatcher.js';
import { EventListenerRegistry } from './EventListenerRegistry.js';
import { Event } from './Event.js';
import { EventEmitter } from './EventEmitter.js';

class AsyncEventEmitter implements EventEmitter {
  constructor(
    private deps: {
      registry: EventListenerRegistry;
      transactionManager: TransactionManager;
      jobsDispatcher: JobsDispatcher;
    }
  ) {}

  async emit(event: Event<any>): Promise<void> {
    const { registry, transactionManager, jobsDispatcher } = this.deps;

    const listeners = registry.getListeners(event.constructor.name);

    if (!listeners) {
      throw new Error(`There are no listeners for event ${event.constructor.name}`);
    }

    if (!transactionManager.isRunning()) {
      throw new Error('Cannot emit events outside of a transaction');
    }

    await jobsDispatcher.dispatchMany(async dispatch =>
      listeners.forEach(listener => dispatch(listener.asJob(), event.payload))
    );
  }
}

export { AsyncEventEmitter };
