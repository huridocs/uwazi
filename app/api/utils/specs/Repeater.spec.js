import { Repeater } from '../Repeater.js';

describe('Repeater', () => {
  let callbackOne;
  let callbackTwo;

  let repeaterOne;
  let repeaterTwo;

  async function advanceTime(time) {
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

    callbackOne = jest.fn().mockImplementation(async () => Promise.resolve());
    callbackTwo = jest.fn().mockImplementation(async () => Promise.resolve());
  });

  it('should be able to have two independant repeaters', async () => {
    repeaterOne = new Repeater(callbackOne, 1);
    repeaterTwo = new Repeater(callbackTwo, 1);

    void repeaterTwo.start();
    void repeaterOne.start();

    await advanceTime(1);

    void repeaterOne.stop();

    await advanceTime(1);

    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackTwo).toHaveBeenCalledTimes(2);
  });

  it('should resolve stopped promise', async () => {
    jest.useRealTimers();
    repeaterOne = new Repeater(callbackOne, 1);

    void repeaterOne.start();

    await expect(repeaterOne.stop()).resolves.toBeUndefined();
  });

  it('should skip interval between executions if stop method is executed', async () => {
    let promise;
    let resolvePromise;
    const sut = new Repeater(
      // oxlint-disable-next-line typescript/promise-function-async
      () => {
        promise = new Promise(resolve => {
          resolvePromise = resolve;
        });

        return promise;
      },
      10_000
    );

    void sut.start();
    resolvePromise();
    await expect(promise).resolves.toBeUndefined();
    await expect(sut.stop()).resolves.toBeUndefined();
  }, 5_000);
});
