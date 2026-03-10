import { AsyncEventEmitter } from './AsyncEventEmitter';
import { EventEmitter } from './EventEmitter';

class EventEmitterFactory {
  private static instance: EventEmitter;

  static default(): EventEmitter {
    if (!EventEmitterFactory.instance) {
      EventEmitterFactory.instance = new AsyncEventEmitter();
    }

    return EventEmitterFactory.instance;
  }
}

export { EventEmitterFactory };
