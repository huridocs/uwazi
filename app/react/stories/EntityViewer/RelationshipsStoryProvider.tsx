import React, { useMemo } from 'react';
import { createStore, Provider } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import {
  localeAtom,
  relationshipTypesAtom,
  templatesAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';

const relationshipStoryTypes = [
  { _id: '6a0c5d0784b3eaec97612923', name: 'related to' },
  { _id: '6a0c5d0084b3eaec97612911', name: 'mentions' },
];

type RelationshipsStoryProviderProps = {
  locale: 'en' | 'es';
  entity: Entity;
  children: React.ReactNode;
};

const RelationshipsStoryProvider = ({
  locale,
  entity,
  children,
}: RelationshipsStoryProviderProps) => {
  const store = useMemo(() => {
    const nextStore = createStore();
    nextStore.set(localeAtom, locale);
    nextStore.set(templatesAtom, templates);
    nextStore.set(translationsAtom, translations);
    nextStore.set(relationshipTypesAtom, relationshipStoryTypes);
    return nextStore;
  }, [locale]);

  return (
    <Provider store={store}>
      <EntityScopedProvider key={entity.sharedId} entity={entity}>
        {children}
      </EntityScopedProvider>
    </Provider>
  );
};

export { RelationshipsStoryProvider };
