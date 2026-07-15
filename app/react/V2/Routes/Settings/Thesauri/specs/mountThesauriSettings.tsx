import React from 'react';
import type { DataRouter } from 'react-router';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { templatesAtom } from '#V2/atoms/index.js';
import { createTestingServices } from '#V2/testing/createTestingServices.js';
import type { TestingThesaurisService } from '#V2/testing/TestingThesaurisService.js';
import type { V2Services } from '#V2/services/types.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { createThesauriLoader } from '../createThesauriLoader.js';
import { createEditThesaurusLoader } from '../createEditThesaurusLoader.js';
import { EditThesaurus } from '../EditThesaurus.js';
import { ThesauriList } from '../ThesauriList.js';
import { thesauri as fixtureThesauri } from './fixtures.js';

const templateAtomValue = [
  {
    _id: 'template1',
    name: 'Document',
    properties: [
      {
        _id: 'property1',
        name: 'prop1',
        label: 'property1',
        type: 'select',
        content: 'thesaurus2',
      },
      {
        _id: 'property2',
        name: 'prop2',
        label: 'property2',
        type: 'select',
        content: 'newThesaurus1',
      },
    ],
  },
];

type MountedThesauriSettings = {
  services: V2Services;
  thesauri: TestingThesaurisService;
  router: DataRouter;
  tree: React.ReactElement;
};

const createThesauriSettingsTree = (
  initialEntry = '/settings/thesauri'
): MountedThesauriSettings => {
  const { services, thesauri } = createTestingServices({
    initialThesauri: fixtureThesauri.map(thesaurus => ({
      _id: thesaurus._id!,
      name: thesaurus.name,
      values: thesaurus.values ?? [],
    })),
  });

  const router = createMemoryRouter(
    [
      {
        path: '/settings/thesauri',
        element: (
          <ServicesProvider value={services}>
            <Outlet />
          </ServicesProvider>
        ),
        children: [
          {
            index: true,
            element: <ThesauriList />,
            loader: createThesauriLoader(services)({}),
          },
          {
            path: 'new',
            element: <EditThesaurus />,
          },
          {
            path: 'edit/:_id',
            element: <EditThesaurus />,
            loader: createEditThesaurusLoader(services)({}),
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return {
    services,
    thesauri,
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

export { createThesauriSettingsTree, templateAtomValue };
