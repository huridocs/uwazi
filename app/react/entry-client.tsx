import './findDOMNodePolyfill.js';
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';

import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router';
import { Provider } from 'jotai';
import { Provider as ReduxProvider } from 'react-redux';
import { getStore } from '#shared/atomStore/index.js';
import { ErrorBoundary } from './V2/Components/ErrorHandling/index.js';
import './App/sockets.js';
import { CustomProvider } from './App/Provider.js';
import { store } from './store.js';
import { syncAtomStoreToRedux, subscribeAtomStoreToRedux } from './V2/atoms/syncReduxFromAtoms.js';
import { getAppRoutes } from './appRoutes.js';
import { resetChunkErrorFlag } from '#V2/shared/errorUtils.js';
import { loadIcons } from '#UI/Icon/library.js';
import { onRecoverableError } from './hydrationMismatch.js';

loadIcons();

// Seed deprecated Redux from atoms after both stores finished initializing.
// Must run before hydrateRoot so first paint matches SSR HTML.
if (window.__atomStoreData__) {
  const atomStore = getStore();
  syncAtomStoreToRedux(atomStore, store);
  subscribeAtomStoreToRedux(atomStore, store);
}

if (window.SENTRY_APP_DSN) {
  Sentry.init({
    release: window.UWAZI_VERSION,
    environment: window.UWAZI_ENVIRONMENT,
    dsn: window.SENTRY_APP_DSN,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration(),
    ],

    tracesSampleRate: 0.1,
  });
}

const router = createBrowserRouter(getAppRoutes());

const App = () => {
  const atomStore = getStore();
  React.useEffect(() => resetChunkErrorFlag(), []);

  return (
    <ReduxProvider store={store as any}>
      <CustomProvider>
        <Provider store={atomStore}>
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </Provider>
      </CustomProvider>
    </ReduxProvider>
  );
};

const container = document.getElementById('root');
const root =
  window.__loadingError__ === undefined
    ? hydrateRoot(container!, <App />, { onRecoverableError })
    : container;

export { root };
