import {isClient} from 'app/utils';
import NProgress from 'nprogress';

const loadingProgressBar = {
  requests: 0,

  start: () => {
    if (isClient) {
      NProgress.configure({showSpinner: false, easing: 'ease', speed: 800, minimum: 0.2});
      NProgress.start();
      loadingProgressBar.requests += 1;
    }
  },

  done: () => {
    if (isClient && NProgress) {
      loadingProgressBar.requests -= 1;
      if (loadingProgressBar.requests <= 0) {
        NProgress.done();
        return;
      }

      NProgress.inc(0.1);
    }
  }
};

export default loadingProgressBar;
