import { atomWithStorage } from 'jotai/utils';

type ThemeMode = 'light' | 'dark';

const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';
const noop = () => undefined;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark';

const readStoredThemeMode = (initialValue: ThemeMode = 'light'): ThemeMode => {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return isThemeMode(storedThemeMode) ? storedThemeMode : initialValue;
};

const themeModeAtom = atomWithStorage<ThemeMode>(
  THEME_MODE_STORAGE_KEY,
  'light',
  {
    getItem: (_key, initialValue) => readStoredThemeMode(initialValue),
    setItem: (key, newValue) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, newValue);
      }
    },
    removeItem: key => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    },
    subscribe: (key, callback, initialValue) => {
      if (typeof window === 'undefined') {
        return noop;
      }

      const onStorage = (event: StorageEvent) => {
        if (event.storageArea !== window.localStorage || event.key !== key) {
          return;
        }

        callback(isThemeMode(event.newValue) ? event.newValue : initialValue);
      };

      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  },
  { getOnInit: true }
);

export { readStoredThemeMode, themeModeAtom };
export type { ThemeMode };
