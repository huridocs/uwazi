import { createStore } from 'jotai';
import { hydrateAtomStore } from '../store.js';
import { localeAtom, settingsAtom, translationsAtom, userAtom } from '../index.js';

const minimalEmbedAtomStoreData = {
  locale: 'en',
  settings: {
    languages: [{ default: true, key: 'en', label: 'English' }],
    private: false,
  },
  user: {},
  isMobile: false,
};

describe('hydrateAtomStore', () => {
  it('should default translations to an empty array for minimal embed hydration', () => {
    const store = createStore();

    hydrateAtomStore(minimalEmbedAtomStoreData as any, store);

    expect(store.get(translationsAtom)).toEqual([]);
    expect(store.get(localeAtom)).toBe('en');
    expect(store.get(settingsAtom)?.private).toBe(false);
    expect(store.get(userAtom)).toEqual({});
  });
});
