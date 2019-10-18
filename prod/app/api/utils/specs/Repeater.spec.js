"use strict";var _Repeater = _interopRequireDefault(require("../Repeater"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('repeat', () => {
  let callback;
  let counter = 0;
  const stopOn = 15;

  beforeEach(() => {
    counter = 1;
    callback = jasmine.createSpy('callback').and.callFake(
    () => new Promise(resolve => {
      setTimeout(() => {
        if (counter === stopOn) {
          resolve();
          _Repeater.default.stop();
        } else {
          counter += 1;
          resolve();
        }
      }, 1);
    }));

  });

  it('should repeat callback call when callback finishes', async () => {
    await _Repeater.default.start(callback, 0);
    expect(callback).toHaveBeenCalledTimes(stopOn);
    expect(counter).toBe(stopOn);
  });
});