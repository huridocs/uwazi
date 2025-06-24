/* eslint-disable react/no-multi-comp */
import React, { ReactNode } from 'react';
import { createRoutesStub } from 'react-router';
import { Translate } from 'app/I18N';

type TestRouterProps = {
  children: ReactNode;
  loaderData?: any;
  path?: string;
  initialEntries?: string[];
};

const HydrateFallback = () => (
  <div data-testid="hydrate-fallback">
    <Translate>Loading</Translate>
  </div>
);

const TestRouterContext = ({
  children,
  loaderData,
  path = '/',
  initialEntries = ['/'],
}: TestRouterProps) => {
  const Stub = createRoutesStub([
    {
      path,
      Component: () => children,
      HydrateFallback,
      loader: () => loaderData,
    },
  ]);

  return <Stub initialEntries={initialEntries} />;
};

export { TestRouterContext };
