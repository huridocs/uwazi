import {isClient} from 'app/utils';
import Nprogress from 'nprogress';

import 'nprogress/nprogress.css';

if (isClient) {
  window.NProgress = Nprogress;
}

const loadingProgressBar = {
  requests: 0,

  start: () => {
    if (isClient && window.NProgress) {
      window.NProgress.configure({showSpinner: false, easing: 'ease', speed: 800, parent: '.app-content', minimum: 0.2});
      window.NProgress.start();
      loadingProgressBar.requests += 1;
    }
  },

  done: () => {
    if (isClient && window.NProgress) {
      loadingProgressBar.requests -= 1;
      if (loadingProgressBar.requests <= 0) {
        window.NProgress.done();
        return;
      }

      window.NProgress.inc(0.1);
    }
  }
};

export default loadingProgressBar;
