import { Repeater } from '../Repeater';

describe('Repeater', () => {
  let callbackOne;
  let callbackTwo;
  let counterOne = 0;
  let counterTwo = 0;
  const stopOnOne = 15;
  const stopOnTwo = 20;
  let repeaterOne;
  let repeaterTwo;

  beforeEach(() => {
    counterOne = 1;
    counterTwo = 1;

    callbackOne = jasmine.createSpy('callbackone').and.callFake(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            if (counterOne === stopOnOne) {
              resolve();
              repeaterOne.stop();
            } else {
              counterOne += 1;
              resolve();
            }
          }, 1);
        })
    );

    callbackTwo = jasmine.createSpy('callbacktwo').and.callFake(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            if (counterTwo === stopOnTwo) {
              resolve();
              repeaterTwo.stop();
            } else {
              counterTwo += 1;
              resolve();
            }
          }, 1);
        })
    );
  });

  it('should be able to have two independant repeaters', async () => {
    repeaterOne = new Repeater(callbackOne, 1);
    await repeaterOne.start();
    expect(callbackOne).toHaveBeenCalledTimes(stopOnOne);
    expect(counterOne).toBe(stopOnOne);

    repeaterTwo = new Repeater(callbackTwo, 1);
    await repeaterTwo.start();
    expect(callbackTwo).toHaveBeenCalledTimes(stopOnTwo);
    expect(counterTwo).toBe(stopOnTwo);
  });
});
