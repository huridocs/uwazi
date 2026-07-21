import { TestUtils } from '#api/common.v2/utils/Test.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AsyncEventEmitter } from './AsyncEventEmitter.js';
import { EventEmitter } from './EventEmitter.js';
import { EventListenerRegistry } from './EventListenerRegistry.js';

class EventEmitterFactory {
  private static sharedRegistry = new EventListenerRegistry();

  /**
   * The shared listener registry. Use this to register listeners at app startup
   * and to reset listeners in tests.
   */
  static get registry(): EventListenerRegistry {
    return EventEmitterFactory.sharedRegistry;
  }

  static default(
    overrides?: Partial<ConstructorParameters<typeof AsyncEventEmitter>[0]>
  ): EventEmitter {
    return new AsyncEventEmitter({
      registry: EventEmitterFactory.sharedRegistry,
      transactionManager: ExecutionContext.transactionManager,
      jobsDispatcher: ExecutionContext.jobsDispatcher,
      ...overrides,
    });
  }

  static forTesting(): EventEmitter {
    return TestUtils.mockClass<EventEmitter>({
      emit: jest.fn(),
    });
  }
}

export { EventEmitterFactory };
