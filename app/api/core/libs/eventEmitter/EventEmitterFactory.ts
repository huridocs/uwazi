import { TestUtils } from '#api/common.v2/utils/Test.js';
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

  static forTesting() {
    return TestUtils.mockClass<EventEmitter>({
      emit: jest.fn(),
      listen: jest.fn(),
      reset: jest.fn(),
    });
  }
}

export { EventEmitterFactory };
