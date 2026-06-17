import React, { useEffect, useRef } from 'react';
import { Provider, createStore, useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import {
  settingsAtom,
  templatesAtom,
  relationshipTypesAtom,
  userAtom,
  localeAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { relationshipsPanelEntityAtom } from './RelationshipsPanel/relationshipsPanelDataAtoms.js';

type EntityScopedProviderProps = {
  entity: Entity;
  children: React.ReactNode;
};

const EntityScopedProvider = ({ entity, children }: EntityScopedProviderProps) => {
  const settings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const user = useAtomValue(userAtom);
  const locale = useAtomValue(localeAtom);
  const translations = useAtomValue(translationsAtom);
  const storeRef = useRef<ReturnType<typeof createStore>>();

  if (!storeRef.current) {
    const store = createStore();
    store.set(settingsAtom, settings);
    store.set(templatesAtom, templates);
    store.set(relationshipTypesAtom, relationshipTypes);
    store.set(userAtom, user);
    store.set(localeAtom, locale);
    store.set(translationsAtom, translations);
    store.set(relationshipsPanelEntityAtom, entity);
    storeRef.current = store;
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    store.set(settingsAtom, settings);
    store.set(templatesAtom, templates);
    store.set(relationshipTypesAtom, relationshipTypes);
    store.set(userAtom, user);
    store.set(localeAtom, locale);
    store.set(translationsAtom, translations);
  }, [settings, templates, relationshipTypes, user, locale, translations]);

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    store.set(relationshipsPanelEntityAtom, entity);
    return () => {
      store.set(relationshipsPanelEntityAtom, undefined);
    };
  }, [entity]);

  return <Provider store={storeRef.current}>{children}</Provider>;
};

export { EntityScopedProvider };
