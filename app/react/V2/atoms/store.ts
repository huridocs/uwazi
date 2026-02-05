import { createStore } from 'jotai';
import { sortBy } from 'lodash';
import { isClient } from 'app/utils';
import { store as reduxStore } from 'app/store';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { ClientTemplateSchema, ClientTranslationSchema, RelationshipTypesType } from 'app/istore';
import { globalMatomoAtom } from './globalMatomoAtom';
import { ciMatomoActiveAtom } from './ciMatomoActiveAtom';
import { relationshipTypesAtom } from './relationshipTypes';
import { settingsAtom } from './settingsAtom';
import { templatesAtom } from './templatesAtom';
import { translationsAtom, localeAtom } from './translationsAtoms';
import { userAtom } from './userAtom';
import { thesauriAtom } from './thesauriAtom';
import { pdfScaleAtom } from './pdfScaleAtom';
import { serverIsMobileAtom } from './isMobileAtom';
import { acceptedSuggestions as ixAcceptedSuggestions } from '../Routes/Settings/IX/components/atoms';

type AtomStoreData = {
  globalMatomo?: { url: string; id: string };
  locale?: string;
  settings?: ClientSettings;
  thesauri?: ClientThesaurus[];
  templates?: ClientTemplateSchema[];
  relationTypes?: RelationshipTypesType[];
  user?: ClientUserSchema;
  ciMatomoActive?: boolean;
  translations: ClientTranslationSchema[];
  acceptedSuggestions?: Set<string>;
  isMobile?: boolean;
};

const atomStore = createStore();

// eslint-disable-next-line max-statements
const hydrateAtomStore = (data: AtomStoreData, store: ReturnType<typeof createStore>) => {
  if (data.ciMatomoActive) store.set(ciMatomoActiveAtom, data.ciMatomoActive);
  if (data.globalMatomo) store.set(globalMatomoAtom, { ...data.globalMatomo });
  if (data.settings) store.set(settingsAtom, data.settings);
  if (data.thesauri) store.set(thesauriAtom, data.thesauri);
  if (data.templates) store.set(templatesAtom, data.templates);
  if (data.relationTypes) store.set(relationshipTypesAtom, data.relationTypes);
  if (data.isMobile !== undefined) store.set(serverIsMobileAtom, data.isMobile);
  store.set(userAtom, data.user);
  store.set(translationsAtom, data.translations);
  store.set(localeAtom, data.locale || 'en');
  store.set(ixAcceptedSuggestions, new Set<string>());
};

if (isClient && window.__atomStoreData__) {
  hydrateAtomStore(window.__atomStoreData__, atomStore);

  //sync deprecated redux store
  atomStore.sub(settingsAtom, () => {
    const value = atomStore.get(settingsAtom);
    reduxStore?.dispatch({ type: 'settings/collection/SET', value });
  });
  atomStore.sub(templatesAtom, () => {
    const value = sortBy(atomStore.get(templatesAtom), 'name');
    reduxStore?.dispatch({ type: 'templates/SET', value });
  });
  atomStore.sub(relationshipTypesAtom, () => {
    const value = sortBy(atomStore.get(relationshipTypesAtom), 'name');
    reduxStore?.dispatch({ type: 'relationTypes/SET', value });
  });
  atomStore.sub(thesauriAtom, () => {
    const value = atomStore.get(thesauriAtom);
    reduxStore?.dispatch({ type: 'dictionaries/SET', value });
  });
  atomStore.sub(pdfScaleAtom, () => {
    const value = atomStore.get(pdfScaleAtom);
    reduxStore?.dispatch({ type: 'viewer/documentScale/SET', value });
  });
  atomStore.sub(translationsAtom, () => {
    const value = atomStore.get(translationsAtom);
    reduxStore?.dispatch({ type: 'translations/SET', value });
  });
}

export type { AtomStoreData };
export { atomStore, hydrateAtomStore };
