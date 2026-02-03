import { AsyncEventEmitter } from './AsyncEventEmitter.js';
import { EventEmitter } from './EventEmitter.js';

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
