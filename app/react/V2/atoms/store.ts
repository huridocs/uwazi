import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { globalMatomoAtom } from './globalMatomoAtom';
import { globalErrorsAtom } from './globalErrorsAtom';

declare global {
  interface Window {
    __atomStoreData__?: { globalMatomo?: { url: string; id: string }; errors: [] };
  }
}

const atomStore = createStore();
if (isClient && window.__atomStoreData__) {
  const atomStoreData = window.__atomStoreData__;
  if (atomStoreData.globalMatomo) {
    atomStore.set(globalMatomoAtom, { ...window.__atomStoreData__?.globalMatomo });
  }
  atomStore.set(globalErrorsAtom, atomStoreData.errors);
}

export { atomStore };
