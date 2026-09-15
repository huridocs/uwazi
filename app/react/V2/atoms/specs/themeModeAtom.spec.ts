/**
 * @jest-environment jsdom
 */
import { createStore } from 'jotai';
import { readStoredThemeMode, themeModeAtom } from '../themeModeAtom.js';

const THEME_MODE_STORAGE_KEY = 'uwazi.themeMode';

describe('readStoredThemeMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns light when storage is empty even if the OS prefers dark', () => {
    window.matchMedia = () =>
      ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
      }) as MediaQueryList;

    expect(readStoredThemeMode()).toBe('light');
  });

  it('returns the stored mode when set', () => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, 'dark');
    expect(readStoredThemeMode()).toBe('dark');
  });
});

describe('themeModeAtom', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('toggles from light to dark in one write', () => {
    const store = createStore();
    store.set(themeModeAtom, 'light');
    store.set(themeModeAtom, prev => (prev === 'light' ? 'dark' : 'light'));
    expect(store.get(themeModeAtom)).toBe('dark');
    expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe('dark');
  });
});
