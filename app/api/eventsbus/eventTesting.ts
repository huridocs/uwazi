import { applicationEventsBus } from '.';
import { EventConstructor } from './EventsBus';

const toEmitEvent = async (
  //use this with expect.extend
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<unknown>,
  eventData: any
) => {
  const emitySpy = jest.spyOn(applicationEventsBus, 'emit');
  await callable();

  if (!emitySpy.mock.calls.length) {
    return { pass: false, message: () => 'No events were emitted.' };
  }

  if (!(emitySpy.mock.calls[0][0] instanceof event)) {
    return { pass: false, message: () => `Event was of the wrong type. Expected ${event.name}` };
  }

  expect(emitySpy.mock.calls[0][0].getData()).toEqual(eventData);
  emitySpy.mockRestore();
  return { pass: true };
};

const spyOnEmit = () => {
  const spy = jest.spyOn(applicationEventsBus, 'emit');

  return {
    expectToEmitEvent: <T>(event: EventConstructor<T>, eventData: T) => {
      expect(spy).toHaveBeenCalled();
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

export { toEmitEvent, spyOnEmit };
