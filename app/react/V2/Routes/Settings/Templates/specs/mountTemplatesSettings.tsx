import React from 'react';
import type { DataRouter } from 'react-router';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { createTestingServices } from '#V2/testing/createTestingServices.js';
import type { TestingTemplatesService } from '#V2/testing/TestingTemplatesService.js';
import type { V2Services } from '#V2/services/types.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createTemplatesLoader } from '../createTemplatesLoader.js';
import { Templates } from '../Templates.js';
import { templates as fixtureTemplates, templateEntityCounts } from './fixtures.js';

type MountedTemplatesSettings = {
  services: V2Services;
  templates: TestingTemplatesService;
  router: DataRouter;
  tree: React.ReactElement;
};

const createTemplatesSettingsTree = (
  initialEntry = '/settings/templates'
): MountedTemplatesSettings => {
  const { services, templates } = createTestingServices({
    initialTemplates: fixtureTemplates,
    initialTemplateEntityCounts: templateEntityCounts,
  });

  const router = createMemoryRouter(
    [
      {
        path: '/settings/templates',
        element: (
          <ServicesProvider value={services}>
            <Outlet />
          </ServicesProvider>
        ),
        children: [
          {
            index: true,
            element: <Templates />,
            loader: createTemplatesLoader(services)({}),
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return {
    services,
    templates,
    router,
    tree: (
      <ThemeProvider>
        <TestAtomStoreProvider>
          <RouterProvider router={router} />
        </TestAtomStoreProvider>
      </ThemeProvider>
    ),
  };
};

export { createTemplatesSettingsTree };
