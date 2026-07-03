import React, { ComponentType } from 'react';
import { createMemoryRouter, LoaderFunction, RouterProvider } from 'react-router';
import { render } from '@testing-library/react';
import { Translate } from '#app/I18N/index.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import type { V2Services } from '#V2/services/types.js';
import { createTestServices } from './createTestServices.js';
import { TestAtomStoreProvider } from './TestAtomStoreProvider.js';

type RenderRouteOptions = {
  Component: ComponentType;
  createLoader: (services: V2Services) => LoaderFunction;
  services?: Parameters<typeof createTestServices>[0];
  atomInitialValues?: Iterable<readonly [any, any]>;
  initialEntries?: string[];
};

const HydrateFallback = () => (
  <div data-testid="hydrate-fallback">
    <Translate>Loading</Translate>
  </div>
);

const renderRoute = ({
  Component,
  createLoader,
  services: overrides,
  atomInitialValues,
  initialEntries = ['/'],
}: RenderRouteOptions) => {
  const testServices = createTestServices(overrides);
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <ServicesProvider value={testServices}>
            <Component />
          </ServicesProvider>
        ),
        loader: createLoader(testServices),
        HydrateFallback,
      },
    ],
    { initialEntries }
  );

  return render(
    <TestAtomStoreProvider initialValues={[...(atomInitialValues ?? [])]}>
      <RouterProvider router={router} />
    </TestAtomStoreProvider>
  );
};

export { renderRoute };
export type { RenderRouteOptions };
