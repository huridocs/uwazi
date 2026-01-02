import { DependenciesContext } from '../DependenciesContext';
import { Event } from './Event';
import { EventEmitter } from './EventEmitter';
import { Listener } from './Listener';

class AsyncEventEmitter implements EventEmitter {
  private events: Map<string, Set<typeof Listener>>;

  constructor() {
    this.events = new Map();
  }

  async emit(event: Event): Promise<void> {
    const listeners = this.events.get(event.constructor.name);

    if (!listeners) {
      return;
    }

    if (!DependenciesContext.transactionManager.isRunning()) {
      throw new Error('Cannot emit events outside of a transaction');
    }

    await DependenciesContext.jobsDispatcher.dispatchMany(async dispatch =>
      listeners.forEach(listener => dispatch(listener.asJob(), event.payload))
    );
  }

  listen(ListenerClass: typeof Listener): void {
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
