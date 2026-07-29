import { createStore } from 'jotai';
import { isClient } from '#app/utils/index.js';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from '#app/apiResponseTypes.js';
import {
  ClientTemplateSchema,
  ClientTranslationSchema,
  RelationshipTypesType,
} from '#app/istore.js';
import { getStore } from '#shared/atomStore/client.store.js';
import { globalMatomoAtom } from './globalMatomoAtom.js';
import { ciMatomoActiveAtom } from './ciMatomoActiveAtom.js';
import { relationshipTypesAtom } from './relationshipTypes.js';
import { settingsAtom } from './settingsAtom.js';
import { templatesAtom } from './templatesAtom.js';
import { translationsAtom, localeAtom } from './translationsAtoms.js';
import { userAtom } from './userAtom.js';
import { thesauriAtom } from './thesauriAtom.js';
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
  store.set(translationsAtom, data.translations ?? []);
  store.set(localeAtom, data.locale || 'en');
  store.set(ixAcceptedSuggestions, new Set<string>());
};

// Hydrate atoms only — do not touch Redux here (circular import with #app/store).
if (isClient && window.__atomStoreData__) {
  hydrateAtomStore(window.__atomStoreData__, getStore());
}

export type { AtomStoreData };
export { hydrateAtomStore };
export { syncAtomStoreToRedux, subscribeAtomStoreToRedux } from './syncReduxFromAtoms.js';
