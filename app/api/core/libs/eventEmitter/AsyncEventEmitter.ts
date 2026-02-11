import { DependenciesContext } from '../DependenciesContext.js';
import { Event } from './Event.js';
import { EventEmitter } from './EventEmitter.js';
import { Listener } from './Listener.js';

class AsyncEventEmitter implements EventEmitter {
  private events: Map<string, Set<typeof Listener>>;

  constructor() {
    this.events = new Map();
  }

  reset(): void {
    this.events = new Map();
  }

  async emit(event: Event<any>): Promise<void> {
    const listeners = this.events.get(event.constructor.name);

    if (!listeners) {
      throw new Error(`There are no listeners for event ${event.constructor.name}`);
    }

    if (!DependenciesContext.transactionManager.isRunning()) {
      throw new Error('Cannot emit events outside of a transaction');
    }

    await DependenciesContext.jobsDispatcher.dispatchMany(async dispatch =>
      listeners.forEach(listener => dispatch(listener.asJob(), event.payload))
    );
  }

  listen(ListenerClass: typeof Listener<any, any>): void {
    const listeners = this.events.get(ListenerClass.eventName);
    const exists = listeners?.has(ListenerClass);

    if (exists) {
      throw new Error(
        `Listener with name ${ListenerClass.name} is already registered for event ${ListenerClass.eventName}`
      );
    }

    if (!listeners) {
      this.events.set(ListenerClass.eventName, new Set());
    }

    this.events.get(ListenerClass.eventName)?.add(ListenerClass);
  }
}

export { AsyncEventEmitter };
