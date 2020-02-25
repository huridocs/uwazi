import repeater from '../Repeater';

describe('repeat', () => {
  let callback;
  let counter = 0;
  const stopOn = 15;

  beforeEach(() => {
    counter = 1;
    callback = jasmine.createSpy('callback').and.callFake(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            if (counter === stopOn) {
              resolve();
              repeater.stop();
            } else {
              counter += 1;
              resolve();
            }
          }, 1);
        })
    );
  });

  it('should repeat callback call when callback finishes', async () => {
    await repeater.start(callback, 0);
    expect(callback).toHaveBeenCalledTimes(stopOn);
    expect(counter).toBe(stopOn);
  });
});
