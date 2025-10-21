/* eslint-disable max-classes-per-file */
import { AbstractEvent } from '../AbstractEvent';
import { EventsBus } from '../EventsBus';

function polledDeferred() {
  let resolve = false;

  const promise = new Promise<void>(r => {
    const polling = setInterval(() => {
      if (resolve) {
        clearInterval(polling);
        r();
      }
    }, 0);
  });

  const resolver = (cb: Function = () => {}) => {
    resolve = true;
    cb();
  };

  return [promise, resolver] as const;
}

async function putIntoEventQueue() {
  return new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });
}

describe('EventsBus', () => {
  // eslint-disable-next-line max-statements
  it('should resolve the emit only after every listener resolved', async () => {
    class DummyEvent1 extends AbstractEvent<string> {}

    const [promise, finishListener1Execution] = polledDeferred();

    const mockListener1 = jest.fn().mockImplementation(async () => promise);
    const mockListener2 = jest.fn();
    const mockAll = jest.fn();

    const eventsBus = new EventsBus();

    eventsBus.on(DummyEvent1, mockListener1);
    eventsBus.on(DummyEvent1, mockListener2);

    eventsBus
      .emit(new DummyEvent1('some dummy data'))
      .then(mockAll)
      .catch(e => fail(e));

    expect(mockAll).not.toHaveBeenCalled();

    finishListener1Execution();

    // This ensures the eventbus has the chance to handle the listener1 resolution
    await putIntoEventQueue();

    expect(mockListener1).toHaveBeenCalledWith('some dummy data');
    expect(mockListener2).toHaveBeenCalledWith('some dummy data');
    expect(mockAll).toHaveBeenCalled();
  });

  it('should only call the listeners for the emitted event', async () => {
    class DummyEvent1 extends AbstractEvent<string> {}
    class DummyEvent2 extends AbstractEvent<string> {}

    const mockListener1 = jest.fn().mockResolvedValue(undefined);
    const mockListener2 = jest.fn().mockResolvedValue(undefined);

    const eventsBus = new EventsBus();

    eventsBus.on(DummyEvent1, mockListener1);
    eventsBus.on(DummyEvent2, mockListener2);

    await eventsBus.emit(new DummyEvent1('some data'));

    expect(mockListener1).toHaveBeenCalledWith('some data');
    expect(mockListener2).not.toHaveBeenCalled();
  });
});
