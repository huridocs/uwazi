import { createStore } from 'jotai';
import { sortBy } from 'lodash';
import { isClient } from 'app/utils';
import { store } from 'app/store';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { ClientTemplateSchema, ClientTranslationSchema } from 'app/istore';
import { globalMatomoAtom } from './globalMatomoAtom';
import { ciMatomoActiveAtom } from './ciMatomoActiveAtom';
import { relationshipTypesAtom } from './relationshipTypes';
import { settingsAtom } from './settingsAtom';
import { templatesAtom } from './templatesAtom';
import { translationsAtom, localeAtom } from './translationsAtoms';
import { userAtom } from './userAtom';
import { thesauriAtom } from './thesauriAtom';
import { pdfScaleAtom } from './pdfScaleAtom';

type AtomStoreData = {
  globalMatomo?: { url: string; id: string };
  locale?: string;
  settings?: ClientSettings;
  thesauri?: ClientThesaurus[];
  templates?: ClientTemplateSchema[];
  user?: ClientUserSchema;
  ciMatomoActive?: boolean;
  translations: ClientTranslationSchema[];
};

declare global {
  interface Window {
    __atomStoreData__?: AtomStoreData;
  }
}

const atomStore = createStore();

const hydrateAtomStore = (data: AtomStoreData) => {
  if (data.ciMatomoActive) atomStore.set(ciMatomoActiveAtom, data.ciMatomoActive);
  if (data.globalMatomo) atomStore.set(globalMatomoAtom, { ...data.globalMatomo });
  if (data.settings) atomStore.set(settingsAtom, data.settings);
  if (data.thesauri) atomStore.set(thesauriAtom, data.thesauri);
  if (data.templates) atomStore.set(templatesAtom, data.templates);
  atomStore.set(userAtom, data.user);
  atomStore.set(translationsAtom, data.translations);
  atomStore.set(localeAtom, data.locale || 'en');
};

if (isClient && window.__atomStoreData__) {
  hydrateAtomStore(window.__atomStoreData__);

  //sync deprecated redux store
  atomStore.sub(settingsAtom, () => {
    const value = atomStore.get(settingsAtom);
    store?.dispatch({ type: 'settings/collection/SET', value });
  });
  atomStore.sub(templatesAtom, () => {
    const value = sortBy(atomStore.get(templatesAtom), 'name');
    store?.dispatch({ type: 'templates/SET', value });
  });
  atomStore.sub(relationshipTypesAtom, () => {
    const value = sortBy(atomStore.get(relationshipTypesAtom), 'name');
    store?.dispatch({ type: 'relationTypes/SET', value });
  });
  atomStore.sub(thesauriAtom, () => {
    const value = atomStore.get(thesauriAtom);
    store?.dispatch({ type: 'dictionaries/SET', value });
  });
  atomStore.sub(pdfScaleAtom, () => {
    const value = atomStore.get(pdfScaleAtom);
    store?.dispatch({ type: 'viewer/documentScale/SET', value });
  });
  atomStore.sub(translationsAtom, () => {
    const value = atomStore.get(translationsAtom);
    store?.dispatch({ type: 'translations', value });
  });
}

export type { AtomStoreData };
export { atomStore, hydrateAtomStore };
