import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { globalMatomoAtom } from './globalMatomoAtom';

declare global {
  interface Window {
    __atomStoreData__?: { globalMatomo: { url: string; id: string } | undefined };
  }
}

const atomStore = createStore();

if (isClient && window.__atomStoreData__?.globalMatomo) {
  atomStore.set(globalMatomoAtom, { ...window.__atomStoreData__?.globalMatomo });
}

export { atomStore };
