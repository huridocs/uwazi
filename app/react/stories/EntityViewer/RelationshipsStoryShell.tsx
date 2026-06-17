import React, { useMemo } from 'react';
import { Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/EntityScopedProvider.js';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/relationships/panel/RelationshipsPanel.js';
import { RelationshipsFiltersDrawer } from '#V2/Routes/Entity/Components/relationships/filters/RelationshipsFiltersDrawer.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { createRelationshipsStoryStore } from './createRelationshipsStoryStore.js';
import { ResetRelationshipsFiltersDrawer } from './ResetRelationshipsFiltersDrawer.js';

type RelationshipsStoryShellProps = {
  locale: 'en' | 'es';
  entity?: Entity;
  className?: string;
  children?: React.ReactNode;
};

const RelationshipsStoryShell = ({
  locale,
  entity = apiEntity,
  className = 'tw-content h-screen max-h-200 min-w-[720px] bg-(--color-theme-surface-raised) p-4',
  children,
}: RelationshipsStoryShellProps) => {
  const storyEntity = useMemo(() => structuredClone(entity), [entity]);
  const store = useMemo(() => createRelationshipsStoryStore(locale), [locale]);
  const mainDocument = storyEntity.documents?.[0];

  const router = useMemo(
    () =>
      createMemoryRouter([
        {
          path: '*',
          element: (
            <Provider store={store}>
              <EntityScopedProvider entity={storyEntity}>
                <ResetRelationshipsFiltersDrawer />
                <div className={className}>
                  <div
                    dir="ltr"
                    className="relative h-full overflow-hidden rounded-md border border-border-soft bg-paper"
                  >
                    {children ?? (
                      <>
                        <RelationshipsPanel mainDocument={mainDocument} />
                        <RelationshipsFiltersDrawer />
                      </>
                    )}
                  </div>
                </div>
              </EntityScopedProvider>
            </Provider>
          ),
        },
      ]),
    [children, className, mainDocument, store]
  );

  return <RouterProvider router={router} />;
};

export { RelationshipsStoryShell };
