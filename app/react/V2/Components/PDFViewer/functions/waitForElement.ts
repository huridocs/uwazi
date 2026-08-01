/* eslint-disable max-statements */
import { isClient } from '#app/utils/index.js';

const waitForElement = async <T extends Element = Element>(
  getter: string,
  timeout = 5000,
  signal?: AbortSignal
): Promise<T> =>
  new Promise((resolve, reject) => {
    if (!isClient || signal?.aborted) {
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

    const cleanup = () => {
      observer.disconnect();
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject();
    };

    const observer = new MutationObserver(() => {
      const found = document.querySelector<T>(getter);
      if (found) {
        cleanup();
        resolve(found);
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    timer = setTimeout(() => {
      cleanup();
      reject();
    }, timeout);

    signal?.addEventListener('abort', onAbort);
  });

export { waitForElement };
