import React, { useMemo } from 'react';
import { Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/RelationshipsPanel/RelationshipsPanel.js';
import { RelationshipsFiltersDrawer } from '#V2/Routes/Entity/Components/RelationshipsPanel/RelationshipsFiltersDrawer.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { createRelationshipsStoryStore } from './createRelationshipsStoryStore.js';
import { ResetRelationshipsFiltersDrawer } from './ResetRelationshipsFiltersDrawer.js';

type RelationshipsPanelStoryProps = {
  locale: 'en' | 'es';
};

const RelationshipsPanelStory = ({ locale }: RelationshipsPanelStoryProps) => {
  const store = useMemo(() => createRelationshipsStoryStore(locale), [locale]);
  const entity = useMemo(() => structuredClone(apiEntity), []);
  const router = useMemo(
    () =>
      createMemoryRouter([
        {
          path: '*',
          element: (
            <Provider store={store}>
              <ResetRelationshipsFiltersDrawer />
              <div className="tw-content h-screen max-h-200 min-w-[720px] bg-(--color-theme-surface-raised) p-4">
                <div
                  dir="ltr"
                  className="relative h-full overflow-hidden rounded-md border border-border-soft bg-paper"
                >
                  <RelationshipsPanel
                    entity={entity}
                    mainDocument={entity.documents?.[0] ?? undefined}
                  />
                  <RelationshipsFiltersDrawer />
                </div>
              </div>
            </Provider>
          ),
        },
      ]),
    [entity, store]
  );

  return <RouterProvider router={router} />;
};

export { RelationshipsPanelStory };
