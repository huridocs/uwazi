import { createStore } from 'jotai';
import sortBy from 'lodash/sortBy.js';
import { isClient } from '#app/utils/index.js';
import { store } from '#app/store.js';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from '#app/apiResponseTypes.js';
import {
  ClientTemplateSchema,
  RelationshipTypesType,
  ClientTranslationSchema,
} from '#app/istore.js';
import { globalMatomoAtom } from './globalMatomoAtom.js';
import { ciMatomoActiveAtom } from './ciMatomoActiveAtom.js';
import { relationshipTypesAtom } from './relationshipTypes.js';
import { settingsAtom } from './settingsAtom.js';
import { templatesAtom } from './templatesAtom.js';
import { translationsAtom, localeAtom } from './translationsAtoms.js';
import { userAtom } from './userAtom.js';
import { thesauriAtom } from './thesauriAtom.js';
import { pdfScaleAtom } from './pdfScaleAtom.js';
import { serverIsMobileAtom } from './isMobileAtom.js';
import { acceptedSuggestions as ixAcceptedSuggestions } from '../Routes/Settings/IX/components/atoms/index.js';

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

const hydrateAtomStore = (data: AtomStoreData) => {
  if (data.ciMatomoActive) atomStore.set(ciMatomoActiveAtom, data.ciMatomoActive);
  if (data.globalMatomo) atomStore.set(globalMatomoAtom, { ...data.globalMatomo });
  if (data.settings) atomStore.set(settingsAtom, data.settings);
  if (data.thesauri) atomStore.set(thesauriAtom, data.thesauri);
  if (data.templates) atomStore.set(templatesAtom, data.templates);
  if (data.relationTypes) atomStore.set(relationshipTypesAtom, data.relationTypes);
  if (data.isMobile !== undefined) atomStore.set(serverIsMobileAtom, data.isMobile);
  atomStore.set(userAtom, data.user);
  atomStore.set(translationsAtom, data.translations);
  atomStore.set(localeAtom, data.locale || 'en');
  atomStore.set(ixAcceptedSuggestions, new Set<string>());
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
    store?.dispatch({ type: 'translations/SET', value });
  });
}

export type { AtomStoreData };
export { atomStore, hydrateAtomStore };
