import LoadingProgressBar from '../LoadingProgressBar';

describe('Load ingProgressBar', () => {
  beforeEach(() => {
    window.NProgress = jasmine.createSpyObj('NProgress', ['configure', 'start', 'done', 'inc']);
  });

  describe('start', () => {
    it('should configure the bar and', () => {
      LoadingProgressBar.start();
      expect(window.NProgress.configure).toHaveBeenCalled();
    });

    it('should start the progress bar', () => {
      LoadingProgressBar.start();
      expect(window.NProgress.start).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should finish the loading bar', () => {
      LoadingProgressBar.requests = 1;
      LoadingProgressBar.done();
      expect(window.NProgress.done).toHaveBeenCalled();
      expect(LoadingProgressBar.requests).toBe(0);
    });

    describe('when there are multiple requests going on', () => {
      it('should increase the bar by a 10%', () => {
        LoadingProgressBar.requests = 2;
        LoadingProgressBar.done();
        expect(window.NProgress.inc).toHaveBeenCalledWith(0.1);
        expect(LoadingProgressBar.requests).toBe(1);
      });
    });
  });
});
