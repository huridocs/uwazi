import { applicationEventsBus } from '.';
import { EventConstructor } from './EventsBus';

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

const toEmitEvent = async (
  //use this with expect.extend
  callable: (...args: any[]) => any | Promise<any>,
  event: EventConstructor<unknown>,
  eventData: any
) => {
  const emitSpy = spyOnEmit();

  await callable();

  emitSpy.expectToEmitEvent(event, eventData);

  emitSpy.restore();
  return { pass: true };
};

export { toEmitEvent, spyOnEmit };
