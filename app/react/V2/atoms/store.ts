import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { store } from 'app/store';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { ClientTemplateSchema } from 'app/istore';
import { globalMatomoAtom } from './globalMatomoAtom';
import { ciMatomoActiveAtom } from './ciMatomoActiveAtom';
import { relationshipTypesAtom } from './relationshipTypes';
import { settingsAtom } from './settingsAtom';
import { templatesAtom } from './templatesAtom';
import { translationsAtom } from './translationsAtom';
import { userAtom } from './userAtom';
import { thesauriAtom } from './thesauriAtom';

type AtomStoreData = {
  globalMatomo?: { url: string; id: string };
  locale?: string;
  settings?: ClientSettings;
  thesauri?: ClientThesaurus[];
  templates?: ClientTemplateSchema[];
  user?: ClientUserSchema;
  ciMatomoActive?: boolean;
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
  atomStore.set(translationsAtom, { locale: data.locale || 'en' });
};

if (isClient && window.__atomStoreData__) {
  hydrateAtomStore(window.__atomStoreData__);

  //sync deprecated redux store
  atomStore.sub(settingsAtom, () => {
    const value = atomStore.get(settingsAtom);
    store?.dispatch({ type: 'settings/collection/SET', value });
  });
  atomStore.sub(templatesAtom, () => {
    const value = atomStore.get(templatesAtom);
    store?.dispatch({ type: 'templates/SET', value });
  });
  atomStore.sub(relationshipTypesAtom, () => {
    const value = atomStore.get(relationshipTypesAtom);
    store?.dispatch({ type: 'relationTypes/SET', value });
  });
  atomStore.sub(thesauriAtom, () => {
    const value = atomStore.get(thesauriAtom);
    store?.dispatch({ type: 'dictionaries/SET', value });
  });
}

export type { AtomStoreData };
export { atomStore, hydrateAtomStore };
