import { atomWithStorage } from 'jotai/utils';

type ThemeMode = 'light' | 'dark';

const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';
const noop = () => undefined;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'light' || value === 'dark';

const getPreferredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const themeModeAtom = atomWithStorage<ThemeMode>(
  THEME_MODE_STORAGE_KEY,
  'light',
  {
    getItem: (key, initialValue) => {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const storedThemeMode = window.localStorage.getItem(key);
      return isThemeMode(storedThemeMode) ? storedThemeMode : getPreferredThemeMode();
    },
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

export { themeModeAtom };
export type { ThemeMode };
