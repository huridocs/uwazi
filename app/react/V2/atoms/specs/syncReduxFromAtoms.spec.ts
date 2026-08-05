/**
 * @jest-environment jsdom
 */
import { createStore } from 'jotai';
import { syncAtomStoreToRedux } from '../syncReduxFromAtoms.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  thesauriAtom,
  translationsAtom,
  userAtom,
  relationshipTypesAtom,
} from '../index.js';

describe('syncAtomStoreToRedux', () => {
  it('should seed the deprecated Redux store from atoms', () => {
    const atomStore = createStore();
    const dispatch = jest.fn();

    atomStore.set(settingsAtom, { site_name: 'Uwazi', languages: [] } as any);
    atomStore.set(templatesAtom, [{ name: 'B' }, { name: 'A' }] as any);
    atomStore.set(relationshipTypesAtom, [{ name: 'Z' }, { name: 'Y' }] as any);
    atomStore.set(thesauriAtom, [{ name: 'Thesaurus' }] as any);
    atomStore.set(translationsAtom, [{ locale: 'en', contexts: [] }]);
    atomStore.set(userAtom, { _id: 'user1' } as any);
    atomStore.set(localeAtom, 'es');

    syncAtomStoreToRedux(atomStore, { dispatch });

    expect(dispatch).toHaveBeenCalledWith({
      type: 'settings/collection/SET',
      value: { site_name: 'Uwazi', languages: [] },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'templates/SET',
      value: [{ name: 'A' }, { name: 'B' }],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'relationTypes/SET',
      value: [{ name: 'Y' }, { name: 'Z' }],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'thesauris/SET',
      value: [{ name: 'Thesaurus' }],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'translations/SET',
      value: [{ locale: 'en', contexts: [] }],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'auth/user/SET',
      value: { _id: 'user1' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'locale/SET',
      value: 'es',
    });
  });
});
