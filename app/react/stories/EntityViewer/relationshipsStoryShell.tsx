import React, { useEffect, useMemo } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsPanelUi } from '#V2/Routes/Entity/Components/context/index.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { RelationshipsStoryProvider } from './RelationshipsStoryProvider.js';
import { RelationshipsSyncedDocumentView } from './relationshipsDocumentViews.js';

type RelationshipsStoryLayout = 'panel' | 'split';

type RelationshipsStoryShellProps = {
  locale: 'en' | 'es';
  layout?: RelationshipsStoryLayout;
  entity?: Entity;
  children?: React.ReactNode;
};

const ResetFiltersDrawer = () => {
  const { setFiltersDrawerOpen } = useRelationshipsPanelUi();

  useEffect(() => {
    setFiltersDrawerOpen(false);
    return () => setFiltersDrawerOpen(false);
  }, [setFiltersDrawerOpen]);

  return null;
};

const SideTabsStub = () => (
  <div className="flex gap-3 text-xs">
    <span className="text-ink-muted">Metadata</span>
    <span className="text-ink-muted">ToC</span>
    <span className="font-semibold text-ink">Relationships</span>
    <span className="text-ink-muted">Search</span>
  </div>
);

const PanelContent = () => <RelationshipsPanel />;

const RelationshipsStoryShell = ({
  locale,
  layout = 'panel',
  entity = apiEntity,
  children,
}: RelationshipsStoryShellProps) => {
  const storyEntity = useMemo(() => structuredClone(entity), [entity]);
  const mainDocument = storyEntity.documents?.[0];
  const shellClass =
    layout === 'split'
      ? 'tw-content h-screen max-h-200 min-w-[960px] bg-(--color-theme-surface-raised) p-4'
      : 'tw-content h-screen max-h-200 min-w-[720px] bg-(--color-theme-surface-raised) p-4';

  const router = useMemo(
    () =>
      createMemoryRouter([
        {
          path: '*',
          element: (
            <RelationshipsStoryProvider locale={locale} entity={storyEntity}>
              <ResetFiltersDrawer />
              <div className={shellClass}>
                {layout === 'split' ? (
                  <div className="h-full overflow-hidden rounded-md border border-border-soft bg-paper">
                    <PaneLayout defaultRatios={[0.58, 0.42]} className="h-full bg-parchment">
                      <PaneLayout.Pane>
                        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-warm p-3 pr-2">
                          <RelationshipsSyncedDocumentView
                            entity={storyEntity}
                            mainDocument={mainDocument!}
                          />
                        </div>
                      </PaneLayout.Pane>
                      <PaneLayout.Pane>
                        <div
                          dir="ltr"
                          className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden border-l border-border-soft"
                        >
                          <div className="shrink-0 px-3 pt-2.5">
                            <SideTabsStub />
                          </div>
                          <div className="min-h-0 flex-1 overflow-hidden px-3 pt-2.5">
                            {children ?? <PanelContent />}
                          </div>
                          <RelationshipsFiltersDrawer />
                        </div>
                      </PaneLayout.Pane>
                    </PaneLayout>
                  </div>
                ) : (
                  <div
                    dir="ltr"
                    className="relative h-full overflow-hidden rounded-md border border-border-soft bg-paper"
                  >
                    {children ?? (
                      <>
                        <PanelContent />
                        <RelationshipsFiltersDrawer />
                      </>
                    )}
                  </div>
                )}
              </div>
            </RelationshipsStoryProvider>
          ),
        },
      ]),
    [children, layout, locale, mainDocument, shellClass, storyEntity]
  );

  return <RouterProvider router={router} />;
};

export { RelationshipsStoryShell };
export type { RelationshipsStoryLayout, RelationshipsStoryShellProps };
