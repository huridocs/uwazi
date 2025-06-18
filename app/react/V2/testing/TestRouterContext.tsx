/* eslint-disable react/no-multi-comp */
import React, { ReactNode } from 'react';
import { createRoutesStub } from 'react-router';

type TestRouterProps = {
  children: ReactNode;
  loaderData?: any;
  path?: string;
  initialEntries?: string[];
};

const HydrateFallback = () => <div data-testid="hydrate-fallback">Loading...</div>;

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
