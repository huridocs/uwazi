import LoadingProgressBar from '../LoadingProgressBar';
import NProgress from 'nprogress';

describe('Load ingProgressBar', () => {
  beforeEach(() => {
    spyOn(NProgress, 'configure');
    spyOn(NProgress, 'start');
    spyOn(NProgress, 'done');
    spyOn(NProgress, 'inc');
  });

  describe('start', () => {
    it('should configure the bar and', () => {
      LoadingProgressBar.start();
      expect(NProgress.configure).toHaveBeenCalled();
    });

    it('should start the progress bar', () => {
      LoadingProgressBar.start();
      expect(NProgress.start).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should finish the loading bar', () => {
      LoadingProgressBar.requests = 1;
      LoadingProgressBar.done();
      expect(NProgress.done).toHaveBeenCalled();
      expect(LoadingProgressBar.requests).toBe(0);
    });

    describe('when there are multiple requests going on', () => {
      it('should increase the bar by a 10%', () => {
        LoadingProgressBar.requests = 2;
        LoadingProgressBar.done();
        expect(NProgress.inc).toHaveBeenCalledWith(0.1);
        expect(LoadingProgressBar.requests).toBe(1);
      });
    });
  });
});
