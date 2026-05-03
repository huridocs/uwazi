import { Listener } from './Listener.js';

class EventListenerRegistry {
  private events: Map<string, Set<typeof Listener>> = new Map();

  register(ListenerClass: typeof Listener<any, any>): void {
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

  getListeners(eventName: string): Set<typeof Listener> | undefined {
    return this.events.get(eventName);
  }

  reset(): void {
    this.events = new Map();
  }
}

export { EventListenerRegistry };
