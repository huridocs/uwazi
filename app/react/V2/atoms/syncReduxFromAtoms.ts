import sortBy from 'lodash/sortBy.js';
import type { createStore } from 'jotai';
import type { Dispatch } from 'redux';
import { settingsAtom } from './settingsAtom.js';
import { templatesAtom } from './templatesAtom.js';
import { translationsAtom, localeAtom } from './translationsAtoms.js';
import { userAtom } from './userAtom.js';
import { thesauriAtom } from './thesauriAtom.js';
import { relationshipTypesAtom } from './relationshipTypes.js';

type AtomStore = ReturnType<typeof createStore>;
type ReduxStore = { dispatch: Dispatch };

/**
 * Seed the deprecated Redux store from atoms (source of truth after SSR).
 * Must run after hydrateAtomStore and before React hydrateRoot.
 */
const syncAtomStoreToRedux = (atomStore: AtomStore, reduxStore?: ReduxStore | null) => {
  if (!reduxStore) {
    return;
  }

  reduxStore.dispatch({
    type: 'settings/collection/SET',
    value: atomStore.get(settingsAtom),
  });
  reduxStore.dispatch({
    type: 'templates/SET',
    value: sortBy(atomStore.get(templatesAtom), 'name'),
  });
  reduxStore.dispatch({
    type: 'relationTypes/SET',
    value: sortBy(atomStore.get(relationshipTypesAtom), 'name'),
  });
  reduxStore.dispatch({
    type: 'thesauris/SET',
    value: atomStore.get(thesauriAtom),
  });
  reduxStore.dispatch({
    type: 'translations/SET',
    value: atomStore.get(translationsAtom),
  });
  reduxStore.dispatch({
    type: 'auth/user/SET',
    value: atomStore.get(userAtom) ?? {},
  });
  reduxStore.dispatch({
    type: 'locale/SET',
    value: atomStore.get(localeAtom),
  });
};

/**
 * Keep Redux mirrored when atoms change at runtime (sockets, V2 settings, etc.).
 */
const subscribeAtomStoreToRedux = (atomStore: AtomStore, reduxStore?: ReduxStore | null) => {
  if (!reduxStore) {
    return;
  }

  atomStore.sub(settingsAtom, () => {
    reduxStore.dispatch({
      type: 'settings/collection/SET',
      value: atomStore.get(settingsAtom),
    });
  });
  atomStore.sub(templatesAtom, () => {
    reduxStore.dispatch({
      type: 'templates/SET',
      value: sortBy(atomStore.get(templatesAtom), 'name'),
    });
  });
  atomStore.sub(relationshipTypesAtom, () => {
    reduxStore.dispatch({
      type: 'relationTypes/SET',
      value: sortBy(atomStore.get(relationshipTypesAtom), 'name'),
    });
  });
  atomStore.sub(thesauriAtom, () => {
    reduxStore.dispatch({
      type: 'thesauris/SET',
      value: atomStore.get(thesauriAtom),
    });
  });
  atomStore.sub(translationsAtom, () => {
    reduxStore.dispatch({
      type: 'translations/SET',
      value: atomStore.get(translationsAtom),
    });
  });
  atomStore.sub(userAtom, () => {
    reduxStore.dispatch({
      type: 'auth/user/SET',
      value: atomStore.get(userAtom) ?? {},
    });
  });
  atomStore.sub(localeAtom, () => {
    reduxStore.dispatch({
      type: 'locale/SET',
      value: atomStore.get(localeAtom),
    });
  });
};

export { syncAtomStoreToRedux, subscribeAtomStoreToRedux };
