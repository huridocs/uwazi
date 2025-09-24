/* eslint-disable react/no-multi-comp */
import React, { ReactNode } from 'react';
import { createRoutesStub } from 'react-router';
import { Translate } from '../../I18N/index.js';

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
      // @ts-expect-error TS(2322): Type '() => React.ReactNode' is not assignable to ... Remove this comment to see the full error message
      Component: () => children,
      HydrateFallback,
      loader: () => loaderData,
    },
  ]);

  return <Stub initialEntries={initialEntries} />;
};

export { TestRouterContext };
