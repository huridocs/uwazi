import React, { useMemo } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { Entity } from '#V2/api/entities/types.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { RelationshipsStoryProvider } from './RelationshipsStoryProvider.js';
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
  const mainDocument = storyEntity.documents?.[0];

  const router = useMemo(
    () =>
      createMemoryRouter([
        {
          path: '*',
          element: (
            <RelationshipsStoryProvider locale={locale} entity={storyEntity}>
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
            </RelationshipsStoryProvider>
          ),
        },
      ]),
    [children, className, locale, mainDocument, storyEntity]
  );

  return <RouterProvider router={router} />;
};

export { RelationshipsStoryShell };
