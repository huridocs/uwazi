import React, { ComponentType, ReactElement } from 'react';
import type { DataRouter } from 'react-router';
import { createMemoryRouter, LoaderFunction, RouterProvider } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import type { V2Services } from '#V2/services/types.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { TestAtomStoreProvider } from './TestAtomStoreProvider.js';

type MountRouteOptions = {
  Component: ComponentType;
  createLoader: (services: V2Services) => LoaderFunction;
  services: V2Services;
  atomInitialValues?: Iterable<readonly [any, any]>;
  initialEntries?: string[];
};

type MountedRoute = {
  tree: ReactElement;
  router: DataRouter;
};

const HydrateFallback = () => (
  <div data-testid="hydrate-fallback">
    <Translate>Loading</Translate>
  </div>
);

const createMountedRoute = ({
  Component,
  createLoader,
  services,
  atomInitialValues,
  initialEntries = ['/'],
}: MountRouteOptions): MountedRoute => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <ServicesProvider value={services}>
            <Component />
          </ServicesProvider>
        ),
        loader: createLoader(services),
        HydrateFallback,
      },
    ],
    { initialEntries }
  );

  return {
    router,
    tree: (
      <ThemeProvider>
        <TestAtomStoreProvider initialValues={[...(atomInitialValues ?? [])]}>
          <RouterProvider router={router} />
        </TestAtomStoreProvider>
      </ThemeProvider>
    ),
  };
};

const mountRoute = (options: MountRouteOptions): ReactElement => createMountedRoute(options).tree;

export { createMountedRoute, mountRoute };
export type { MountRouteOptions, MountedRoute };
