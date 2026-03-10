import { Repeater } from '../Repeater';

describe('Repeater', () => {
  let callbackOne;
  let callbackTwo;

  let repeaterOne;
  let repeaterTwo;

  function advanceTime(time) {
    jest.advanceTimersByTime(time);
    return new Promise(resolve => {
      setImmediate(resolve);
    });
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers('legacy');

    callbackOne = jest.fn().mockImplementation(() => Promise.resolve());
    callbackTwo = jest.fn().mockImplementation(() => Promise.resolve());
  });

  it('should be able to have two independant repeaters', async () => {
    repeaterOne = new Repeater(callbackOne, 1);
    repeaterTwo = new Repeater(callbackTwo, 1);

    repeaterTwo.start();
    repeaterOne.start();

    await advanceTime(1);

    repeaterOne.stop();

    await advanceTime(1);

    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackTwo).toHaveBeenCalledTimes(2);
  });

  it('should resolve stopped promise', async () => {
    jest.useRealTimers();
    repeaterOne = new Repeater(callbackOne, 1);

    repeaterOne.start();

    await expect(repeaterOne.stop()).resolves.toBeUndefined();
  });

  it('should skip interval between executions if stop method is executed', async () => {
    let promise;
    let resolvePromise;
    const sut = new Repeater(() => {
      promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      return promise;
    }, 10_000);

    sut.start();
    resolvePromise();
    await expect(promise).resolves.toBeUndefined();
    await expect(sut.stop()).resolves.toBeUndefined();
  }, 5_000);
});
