import React, { Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { Provider } from 'jotai';
import { Provider as ReduxProvider } from 'react-redux';
import type { RequestError } from 'V2/shared/errorUtils';
import { ErrorBoundary } from './V2/Components/ErrorHandling';
import './App/sockets';
import { getRoutes } from './Routes';
import CustomProvider from './App/Provider';
import { settingsAtom, atomStore, userAtom } from './V2/atoms';
import { store } from './store';

declare global {
  interface Window {
    __loadingError__?: RequestError;
  }
}

if (window.SENTRY_APP_DSN) {
  Sentry.init({
    release: window.UWAZI_VERSION,
    environment: window.UWAZI_ENVIRONMENT,
    dsn: window.SENTRY_APP_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay(),
    ],

    tracesSampleRate: 0.1,
  });
}

const router = createBrowserRouter(
  getRoutes(atomStore.get(settingsAtom), atomStore.get(userAtom)?._id)
);

const App = () => (
  <ReduxProvider store={store as any}>
    <CustomProvider>
      <Provider store={atomStore}>
        <ErrorBoundary>
          <Suspense>
            <RouterProvider router={router} fallbackElement={null} />
          </Suspense>
        </ErrorBoundary>
      </Provider>
    </CustomProvider>
  </ReduxProvider>
);

const container = document.getElementById('root');
const root = window.__loadingError__ === undefined ? hydrateRoot(container!, <App />) : container;

export { root };
