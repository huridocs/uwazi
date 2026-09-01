import React, { useLayoutEffect, useMemo } from 'react';
import { createStore, Provider } from 'jotai';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  localeAtom,
  relationshipTypesAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';
import { createStubEntityTabsState } from '#V2/Routes/Entity/Components/relationships/specs/helpers/createStubEntityTabsState.js';
import { EntityTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { relationshipQueryFromEntity } from '#V2/Routes/Entity/Components/relationships/specs/helpers/relationshipQueryFromEntity.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';

const relationshipStoryTypes = [
  { _id: '6a0c5d0784b3eaec97612923', name: 'related to' },
  { _id: '6a0c5d0084b3eaec97612911', name: 'mentions' },
];

type RelationshipsStoryProviderProps = {
  locale: 'en' | 'es';
  entity: Entity;
  storyTemplates?: ClientTemplateSchema[];
  preloadEntities?: Entity[];
  relationshipTypes?: { _id: string; name: string }[];
  user?: ClientUserSchema;
  children: React.ReactNode;
};

const RelationshipsStoryProvider = ({
  locale,
  entity,
  storyTemplates,
  preloadEntities,
  relationshipTypes,
  user,
  children,
}: RelationshipsStoryProviderProps) => {
  const store = useMemo(() => {
    const nextStore = createStore();
    nextStore.set(localeAtom, locale);
    nextStore.set(templatesAtom, storyTemplates ?? templates);
    nextStore.set(translationsAtom, translations);
    nextStore.set(relationshipTypesAtom, relationshipTypes ?? relationshipStoryTypes);
    if (user) {
      nextStore.set(userAtom, user);
    }
    return nextStore;
  }, [locale, relationshipTypes, storyTemplates, user]);

  useLayoutEffect(() => {
    preloadEntities?.forEach(item => {
      entityLoaderCache.setEntity(item.sharedId, item.language ?? locale, item);
    });
  }, [locale, preloadEntities]);

  const entityTabs = useMemo(() => createStubEntityTabsState(), []);

  return (
    <Provider store={store}>
      <EntityScopedProvider
        key={entity.sharedId}
        entity={entity}
        language={entity.language ?? locale}
        mainDocument={entity.documents?.[0]}
        relationshipQuery={relationshipQueryFromEntity(entity, entity.documents?.[0]?._id)}
      >
        <EntityTabsProvider value={entityTabs}>{children}</EntityTabsProvider>
      </EntityScopedProvider>
    </Provider>
  );
};

export { RelationshipsStoryProvider };
