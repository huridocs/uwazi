import { createStore } from 'jotai';
import { isClient } from 'app/utils';
import { store } from 'app/store';
import { ClientTemplateSchema } from 'app/istore';
import { ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { globalMatomoAtom } from './globalMatomoAtom';
import { relationshipTypesAtom } from './relationshipTypes';
import { settingsAtom } from './settingsAtom';
import { templatesAtom } from './templatesAtom';
import { thesaurisAtom } from './thesaurisAtom';
import { translationsAtom } from './translationsAtom';
import { userAtom } from './userAtom';

type AtomStoreData = {
  globalMatomo?: { url: string; id: string };
  settings?: ClientSettings;
  templates?: ClientTemplateSchema[];
  thesauri?: ClientThesaurus[];
  user?: ClientUserSchema;
  locale?: string;
};

declare global {
  interface Window {
    __atomStoreData__?: AtomStoreData;
  }
}

const atomStore = createStore();

if (isClient && window.__atomStoreData__) {
  const { globalMatomo, settings, templates, thesauri, user, locale } = window.__atomStoreData__;

  if (globalMatomo) atomStore.set(globalMatomoAtom, { ...globalMatomo });
  if (settings) atomStore.set(settingsAtom, settings);
  if (templates) atomStore.set(templatesAtom, templates);
  if (thesauri) atomStore.set(thesaurisAtom, thesauri);
  atomStore.set(translationsAtom, { locale: locale || 'en' });
  atomStore.set(userAtom, user);

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
}

export type { AtomStoreData };
export { atomStore };
