import { createStore } from 'jotai';
import { hydrateAtomStore } from '../store.js';
import {
  localeAtom,
  requestOriginAtom,
  settingsAtom,
  translationsAtom,
  userAtom,
} from '../index.js';

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

  it('should hydrate the request origin used for absolute SEO URLs', () => {
    const store = createStore();
    hydrateAtomStore({ ...minimalEmbedAtomStoreData, origin: 'https://example.org' } as any, store);

    expect(store.get(requestOriginAtom)).toBe('https://example.org');
  });
});
