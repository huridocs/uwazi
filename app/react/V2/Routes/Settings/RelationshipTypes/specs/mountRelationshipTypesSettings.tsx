import React from 'react';
import type { DataRouter } from 'react-router';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { templatesAtom } from '#V2/atoms/index.js';
import { createTestingServices } from '#V2/testing/createTestingServices.js';
import type { TestingRelationshipTypesService } from '#V2/testing/TestingRelationshipTypesService.js';
import type { V2Services } from '#V2/services/types.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createRelationshipTypesLoader } from '../createRelationshipTypesLoader.js';
import { RelationshipTypes } from '../RelationshipTypes.js';
import { relationshipTypes as fixtureRelationshipTypes, templateAtomValue } from './fixtures.js';

type MountedRelationshipTypesSettings = {
  services: V2Services;
  relationshipTypes: TestingRelationshipTypesService;
  router: DataRouter;
  tree: React.ReactElement;
};

const createRelationshipTypesSettingsTree = (
  initialEntry = '/settings/relationship-types'
): MountedRelationshipTypesSettings => {
  const { services, relationshipTypes } = createTestingServices({
    initialRelationshipTypes: fixtureRelationshipTypes,
  });

  const router = createMemoryRouter(
    [
      {
        path: '/settings/relationship-types',
        element: (
          <ServicesProvider value={services}>
            <Outlet />
          </ServicesProvider>
        ),
        children: [
          {
            index: true,
            element: <RelationshipTypes />,
            loader: createRelationshipTypesLoader(services)({}),
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return {
    services,
    relationshipTypes,
    router,
    tree: (
      <ThemeProvider>
        <TestAtomStoreProvider initialValues={[[templatesAtom, templateAtomValue]]}>
          <RouterProvider router={router} />
        </TestAtomStoreProvider>
      </ThemeProvider>
    ),
  };
};

export { createRelationshipTypesSettingsTree, templateAtomValue };
