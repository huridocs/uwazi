import { AbstractEvent } from './AbstractEvent';

interface Listener<T> {
  (data: T): Promise<void>;
}

interface EventConstructor<T> {
  new (data: T): AbstractEvent<T>;
}

interface EventListenersMap {
  [event: string]: Array<Listener<any>>;
}
class EventsBus {
  private listeners: EventListenersMap = {};

  async emit(event: AbstractEvent<unknown>) {
    if (this.listeners[event.getName()]) {
      await Promise.all(
        this.listeners[event.getName()].map(async listener => listener(event.getData()))
      );
    }
  }

  on<T>(event: EventConstructor<T>, listener: Listener<T>) {
    if (!this.listeners[event.name]) {
      this.listeners[event.name] = [];
    }

    this.listeners[event.name].push(listener);
  }
}

export { EventsBus };
export type { EventConstructor };
