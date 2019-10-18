"use strict";var _nprogress = _interopRequireDefault(require("nprogress"));
var _LoadingProgressBar = _interopRequireDefault(require("../LoadingProgressBar"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Load ingProgressBar', () => {
  beforeEach(() => {
    spyOn(_nprogress.default, 'configure');
    spyOn(_nprogress.default, 'start');
    spyOn(_nprogress.default, 'done');
    spyOn(_nprogress.default, 'inc');
  });

  describe('start', () => {
    it('should configure the bar and', () => {
      _LoadingProgressBar.default.start();
      expect(_nprogress.default.configure).toHaveBeenCalled();
    });

    it('should start the progress bar', () => {
      _LoadingProgressBar.default.start();
      expect(_nprogress.default.start).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should finish the loading bar', () => {
      _LoadingProgressBar.default.requests = 1;
      _LoadingProgressBar.default.done();
      expect(_nprogress.default.done).toHaveBeenCalled();
      expect(_LoadingProgressBar.default.requests).toBe(0);
    });

    describe('when there are multiple requests going on', () => {
      it('should increase the bar by a 10%', () => {
        _LoadingProgressBar.default.requests = 2;
        _LoadingProgressBar.default.done();
        expect(_nprogress.default.inc).toHaveBeenCalledWith(0.1);
        expect(_LoadingProgressBar.default.requests).toBe(1);
      });
    });
  });
});