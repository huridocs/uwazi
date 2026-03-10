import { isClient } from 'app/utils';
import NProgress from 'nprogress';

const loadingProgressBar = {
  requests: 0,

  start: () => {
    if (isClient) {
      const parent = document.querySelector('.nprogress-container')
        ? '.nprogress-container'
        : 'body';

      NProgress.configure({
        showSpinner: false,
        easing: 'ease',
        speed: 800,
        minimum: 0.2,
        barSelector: '[role="progressbar "]',
        spinnerSelector: '[role="spinner"]',
        parent,
        template:
          '<div class="bar" role="progressbar "><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>',
      });
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
  },
};

export default loadingProgressBar;
