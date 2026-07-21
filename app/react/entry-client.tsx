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
import { getAppRoutes } from './appRoutes.js';
import { resetChunkErrorFlag } from '#V2/shared/errorUtils.js';
import { loadIcons } from '#UI/Icon/library.js';

loadIcons();

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
const root = window.__loadingError__ === undefined ? hydrateRoot(container!, <App />) : container;
const silentWarnings = [
  'Warning: %s uses the legacy childContextTypes API which is no longer supported and will be removed in the next major release.',
  'Warning: %s: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.%s',
  'Warning: %s uses the legacy contextTypes API which is no longer supported and will be removed in the next major release.',
  'Warning: findDOMNode is deprecated and will be removed in the next major release.',
];

const isSilentWarning = (warning: any) =>
  silentWarnings.find(w => typeof warning === 'string' && warning.includes(w)) !== undefined;

const origConsoleError = window.console.error;

window.console.error = (...args) => {
  if (isSilentWarning(args[0])) {
    return;
  }
  try {
    origConsoleError.apply(window.console, args);
  } catch (consoleError) {
    const original =
      args.find(arg => arg instanceof Error) ??
      (typeof args[0] === 'string' ? new Error(args[0]) : undefined);
    let errorToThrow = original ?? consoleError;

    try {
      origConsoleError('console.error wrapper failed:', consoleError);
    } catch (loggingError) {
      errorToThrow = original ?? loggingError;
    }
    throw errorToThrow;
  }
};

export { root };
