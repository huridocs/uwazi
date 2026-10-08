import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import {
  DEFAULT_LIBRARY_CARD_DISPLAY,
  parseLibraryCardDisplay,
  type LibraryCardDisplayState,
} from './libraryCardDisplay.js';

const LIBRARY_CARD_DISPLAY_STORAGE_KEY = 'library-v2-card-display';

const storage = createJSONStorage<LibraryCardDisplayState>(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
});

const libraryCardDisplayAtom = atomWithStorage<LibraryCardDisplayState>(
  LIBRARY_CARD_DISPLAY_STORAGE_KEY,
  DEFAULT_LIBRARY_CARD_DISPLAY,
  {
    ...storage,
    getItem: (key, initialValue) => parseLibraryCardDisplay(storage.getItem(key, initialValue)),
  },
  { getOnInit: true }
);

export { LIBRARY_CARD_DISPLAY_STORAGE_KEY, libraryCardDisplayAtom };
