/* eslint-disable max-statements */
import { isClient } from '#app/utils/index.js';

const waitForElement = async <T extends Element = Element>(
  getter: string,
  timeout = 5000
): Promise<T> =>
  new Promise((resolve, reject) => {
    if (!isClient) {
      reject();
      return;
    }

    const element = document.querySelector<T>(getter);

    if (element) {
      resolve(element);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    const root = document.body || document.documentElement || document;

    const observer = new MutationObserver(() => {
      const found = document.querySelector<T>(getter);
      if (found) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(found);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    timer = setTimeout(() => {
      observer.disconnect();
      reject();
    }, timeout);
  });

export { waitForElement };
