import { applicationEventsBus } from '.';
import { EventConstructor } from './EventsBus';

const toEmitEvent = async (
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

export { toEmitEvent };
