import React, { useMemo } from 'react';
import { Provider } from 'jotai';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/EntityScopedProvider.js';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/RelationshipsPanel/RelationshipsPanel.js';
import { RelationshipsFiltersDrawer } from '#V2/Routes/Entity/Components/RelationshipsPanel/RelationshipsFiltersDrawer.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { createRelationshipsStoryStore } from './createRelationshipsStoryStore.js';
import { RelationshipsSyncedDocumentView } from './RelationshipsSyncedDocumentView.js';
import { ResetRelationshipsFiltersDrawer } from './ResetRelationshipsFiltersDrawer.js';

type RelationshipsWithPanelStoryProps = {
  locale: 'en' | 'es';
};

const RelationshipsSideTabsStub = () => (
  <div className="flex gap-3 text-xs">
    <span className="text-ink-muted">Metadata</span>
    <span className="text-ink-muted">ToC</span>
    <span className="font-semibold text-ink">Relationships</span>
    <span className="text-ink-muted">Search</span>
  </div>
);

const RelationshipsWithPanelStory = ({ locale }: RelationshipsWithPanelStoryProps) => {
  const entity = useMemo(() => structuredClone(apiEntity), []);
  const store = useMemo(() => createRelationshipsStoryStore(locale), [locale]);
  const mainDocument = entity.documents![0];
  const router = useMemo(
    () =>
      createMemoryRouter([
        {
          path: '*',
          element: (
            <Provider store={store}>
              <EntityScopedProvider entity={entity}>
                <ResetRelationshipsFiltersDrawer />
                <div className="tw-content h-screen max-h-200 min-w-[960px] bg-(--color-theme-surface-raised) p-4">
                  <div className="h-full overflow-hidden rounded-md border border-border-soft bg-paper">
                    <PaneLayout defaultRatios={[0.58, 0.42]} className="h-full bg-parchment">
                      <PaneLayout.Pane>
                        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-warm p-3 pr-2">
                          <RelationshipsSyncedDocumentView
                            entity={entity}
                            mainDocument={mainDocument}
                          />
                        </div>
                      </PaneLayout.Pane>
                      <PaneLayout.Pane>
                        <div
                          dir="ltr"
                          className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden border-l border-border-soft"
                        >
                          <div className="shrink-0 px-3 pt-2.5">
                            <RelationshipsSideTabsStub />
                          </div>
                          <div className="min-h-0 flex-1 overflow-hidden px-3 pt-2.5">
                            <RelationshipsPanel mainDocument={mainDocument} />
                          </div>
                          <RelationshipsFiltersDrawer />
                        </div>
                      </PaneLayout.Pane>
                    </PaneLayout>
                  </div>
                </div>
              </EntityScopedProvider>
            </Provider>
          ),
        },
      ]),
    [entity, mainDocument, store]
  );

  return <RouterProvider router={router} />;
};

export { RelationshipsWithPanelStory };
