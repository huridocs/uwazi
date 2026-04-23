import { isClient } from '#app/utils/index.js';
import { startLoading, endLoading } from '#V2/utils/notifyBridge.js';

const loadingProgressBar = {
  requests: 0,

  start: () => {
    if (isClient) {
      loadingProgressBar.requests += 1;
      startLoading();
    }
  },

  done: () => {
    if (isClient) {
      loadingProgressBar.requests -= 1;
      if (loadingProgressBar.requests <= 0) {
        loadingProgressBar.requests = 0;
        endLoading();
      }
    }
  },
};

export { loadingProgressBar };
