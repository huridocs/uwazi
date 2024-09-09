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

if (isClient && window.__atomStoreData__) {
  const { globalMatomo, locale, settings, thesauri, templates, user, ciMatomoActive } =
    window.__atomStoreData__;

  if (ciMatomoActive) atomStore.set(ciMatomoActiveAtom, ciMatomoActive);
  if (globalMatomo) atomStore.set(globalMatomoAtom, { ...globalMatomo });
  if (settings) atomStore.set(settingsAtom, settings);
  if (thesauri) atomStore.set(thesauriAtom, thesauri);
  if (templates) atomStore.set(templatesAtom, templates);
  atomStore.set(userAtom, user);
  atomStore.set(translationsAtom, { locale: locale || 'en' });

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
export { atomStore };
