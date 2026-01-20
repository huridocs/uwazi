import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { EventConstructor } from '#api/core/libs/eventsbus/EventsBus.js';

const spyOnEmit = () => {
  const spy = jest.spyOn(applicationEventsBus, 'emit');

  return {
    expectToEmitEvent: <T>(event: EventConstructor<T>) => {
      const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
      if (typeof expectedCall === 'undefined') {
        throw new Error(`No event of type ${event.name} was emitted.`);
      }
      spy.mockClear();
    },
    expectToEmitEventWith: <T extends Object>(event: EventConstructor<T>, eventData: T) => {
      const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
      if (typeof expectedCall === 'undefined') {
        throw new Error(`No event of type ${event.name} was emitted.`);
      }
      expect(expectedCall[0].getData()).toMatchObject(eventData);
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

const failAndRestore = (spy: jest.SpyInstance, message: string) => {
  spy.mockRestore();
  return { pass: false, message: () => message };
};

const toEmitEvent = async <T>(
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<T>
): MatcherReturnType => {
  const spy = jest.spyOn(applicationEventsBus, 'emit');

  await callable();

  const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
  if (typeof expectedCall === 'undefined') {
    return failAndRestore(spy, `No event of type ${event.name} was emitted.`);
  }

  spy.mockRestore();
  return { pass: true, message: () => 'Pass.' };
};

const toEmitEventWith = async <T>(
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<T>,
  eventData: any
): MatcherReturnType => {
  const spy = jest.spyOn(applicationEventsBus, 'emit');

  await callable();

  const expectedCall = spy.mock.calls.find(call => call[0] instanceof event);
  if (typeof expectedCall === 'undefined') {
    return failAndRestore(spy, `No event of type ${event.name} was emitted.`);
  }
  expect(expectedCall[0].getData()).toMatchObject(eventData);

  spy.mockRestore();
  return { pass: true, message: () => 'Pass.' };
};

interface CustomMatchers<R = unknown> {
  toEmitEvent<T>(event: EventConstructor<T>): Promise<R>;
  toEmitEventWith<T>(event: EventConstructor<T>, eventData: any): Promise<R>;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

export { spyOnEmit, toEmitEvent, toEmitEventWith };
