import {isClient} from 'app/utils';

let requests = 0;

export default {
  start: () => {
    if (isClient && window.NProgress) {
      window.NProgress.configure({showSpinner: false, easing: 'ease', speed: 1000, parent: '.app-content'});
      window.NProgress.start();
      requests += 1;
    }
  },

  done: () => {
    if (isClient && window.NProgress) {
      requests -= 1;
      if (requests <= 0) {
        window.NProgress.done();
      }
    }
  }
};
