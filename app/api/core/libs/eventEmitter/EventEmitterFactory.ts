import { AsyncEventEmitter } from '#api/core/libs/eventEmitter/AsyncEventEmitter.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';

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
