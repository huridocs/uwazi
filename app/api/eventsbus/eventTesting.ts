import { applicationEventsBus } from '.';
import { EventConstructor } from './EventsBus';

const spyOnEmit = () => {
  const spy = jest.spyOn(applicationEventsBus, 'emit');

  return {
    expectToEmitEvent: <T>(event: EventConstructor<T>) => {
      const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
      if (typeof expectedCall === 'undefined') {
        fail(`No event of type ${event.name} was emitted.`);
      }
      spy.mockClear();
    },
    expectToEmitEventWith: <T>(event: EventConstructor<T>, eventData: T) => {
      const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
      if (typeof expectedCall === 'undefined') {
        fail(`No event of type ${event.name} was emitted.`);
      }
      expect(expectedCall[0].getData()).toEqual(eventData);
      spy.mockClear();
    },
    spy,
    restore: () => {
      spy.mockRestore();
    },
  };
};

//wrappers for usage with expect.extend
type MatcherReturnType = Promise<jest.CustomMatcherResult>;

const toEmitEvent = async <T>(
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<T>
): MatcherReturnType => {
  const emitSpy = spyOnEmit();

  await callable();

  emitSpy.expectToEmitEvent(event);

  emitSpy.restore();
  return { pass: true, message: () => 'Pass.' };
};

const toEmitEventWith = async <T>(
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<T>,
  eventData: any
): MatcherReturnType => {
  const emitSpy = spyOnEmit();

  await callable();

  emitSpy.expectToEmitEventWith(event, eventData);

  emitSpy.restore();
  return { pass: true, message: () => 'Pass.' };
};

interface CustomMatchers<R = unknown> {
  toEmitEvent<T>(event: EventConstructor<T>): R;
  toEmitEventWith<T>(event: EventConstructor<T>, eventData: any): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

export { spyOnEmit, toEmitEvent, toEmitEventWith };
