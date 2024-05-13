import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { globalMatomoAtom } from './globalMatomoAtom';

declare global {
  interface Window {
    __globalMatomo__: { url: string; id: string } | undefined;
  }
}

const atomStore = createStore();

if (isClient && window.__globalMatomo__) {
  atomStore.set(globalMatomoAtom, {
    id: window.__globalMatomo__.id,
    url: window.__globalMatomo__.url,
  });
}

export { atomStore };
