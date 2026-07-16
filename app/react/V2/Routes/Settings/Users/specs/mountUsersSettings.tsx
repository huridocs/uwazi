import React from 'react';
import type { DataRouter } from 'react-router';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import {
  createTestingUsersSettingsServices,
  type TestingUserGroupsService,
  type TestingUsersService,
} from '#V2/testing/TestingUsersService.js';
import { createUsersLoader } from '../createUsersLoader.js';
import { Users } from '../Users.js';
import { groups as fixtureGroups, users as fixtureUsers } from './fixtures.js';

type MountedUsersSettings = {
  services: V2Services;
  users: TestingUsersService;
  userGroups: TestingUserGroupsService;
  router: DataRouter;
  tree: React.ReactElement;
};

const createUsersSettingsTree = (initialEntry = '/settings/users'): MountedUsersSettings => {
  const {
    services: testingServices,
    users,
    userGroups,
  } = createTestingUsersSettingsServices({
    initialUsers: fixtureUsers,
    initialGroups: fixtureGroups,
  });

  const services: V2Services = {
    ...httpServices,
    users: testingServices.users,
    userGroups: testingServices.userGroups,
  };

  const router = createMemoryRouter(
    [
      {
        path: '/settings/users',
        element: (
          <ServicesProvider value={services}>
            <Users />
          </ServicesProvider>
        ),
        loader: createUsersLoader(services)({}),
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return {
    services,
    users,
    userGroups,
    router,
    tree: (
      <ThemeProvider>
        <TestAtomStoreProvider initialValues={[]}>
          <RouterProvider router={router} />
        </TestAtomStoreProvider>
      </ThemeProvider>
    ),
  };
};

export { createUsersSettingsTree };
