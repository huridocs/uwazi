import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import {
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  type LibraryTableDensity,
  type LibraryTableDisplayState,
} from './libraryTableColumns.js';

const LIBRARY_TABLE_DISPLAY_STORAGE_KEY = 'library-v2-table-display';

const isDensity = (value: unknown): value is LibraryTableDensity =>
  value === 'comfortable' || value === 'compact';

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const parseDisplayState = (value: unknown): LibraryTableDisplayState => {
  if (!value || typeof value !== 'object') {
    return DEFAULT_LIBRARY_TABLE_DISPLAY;
  }
  const raw = value as Partial<LibraryTableDisplayState>;
  return {
    density: isDensity(raw.density) ? raw.density : DEFAULT_LIBRARY_TABLE_DISPLAY.density,
    hidden: asStringArray(raw.hidden),
    extraVisible: asStringArray(raw.extraVisible),
  };
};

const storage = createJSONStorage<LibraryTableDisplayState>(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
});

const libraryTableDisplayAtom = atomWithStorage<LibraryTableDisplayState>(
  LIBRARY_TABLE_DISPLAY_STORAGE_KEY,
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  {
    ...storage,
    getItem: (key, initialValue) => parseDisplayState(storage.getItem(key, initialValue)),
  },
  { getOnInit: true }
);

export { LIBRARY_TABLE_DISPLAY_STORAGE_KEY, libraryTableDisplayAtom };
