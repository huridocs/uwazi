import React, { useMemo } from 'react';
import { createStore, Provider } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import {
  localeAtom,
  relationshipTypesAtom,
  templatesAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';

const relationshipStoryTypes = [
  { _id: '6a0c5d0784b3eaec97612923', name: 'related to' },
  { _id: '6a0c5d0084b3eaec97612911', name: 'mentions' },
];

type RelationshipsStoryProviderProps = {
  locale: 'en' | 'es';
  entity: Entity;
  storyTemplates?: ClientTemplateSchema[];
  children: React.ReactNode;
};

const RelationshipsStoryProvider = ({
  locale,
  entity,
  storyTemplates,
  children,
}: RelationshipsStoryProviderProps) => {
  const store = useMemo(() => {
    const nextStore = createStore();
    nextStore.set(localeAtom, locale);
    nextStore.set(templatesAtom, storyTemplates ?? templates);
    nextStore.set(translationsAtom, translations);
    nextStore.set(relationshipTypesAtom, relationshipStoryTypes);
    return nextStore;
  }, [locale, storyTemplates]);

  return (
    <Provider store={store}>
      <EntityScopedProvider key={entity.sharedId} entity={entity}>
        {children}
      </EntityScopedProvider>
    </Provider>
  );
};

export { RelationshipsStoryProvider };
