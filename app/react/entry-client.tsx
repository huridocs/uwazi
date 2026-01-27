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
import { ErrorBoundary } from '#V2/Components/ErrorHandling/index.js';
import './App/sockets';
import 'react-widgets/dist/css/react-widgets.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'nprogress/nprogress.css';
import 'flag-icons/sass/flag-icons.scss';
import 'flowbite/dist/flowbite.min.css';
import '#app/App/styles/tailwind.css';
import '#app/App/scss/styles.scss';
import CustomProvider from '#app/App/Provider.js';
import { atomStore } from '#V2/atoms/index.js';
import { store } from '#app/store.js';
import { routes } from '#app/appRoutes.js';

window.__entryClientExecuting = true;
console.log('[entry-client] Starting execution');
if (typeof document !== 'undefined') {
  const testDiv = document.createElement('div');
  testDiv.id = '__entryClientTest';
  testDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:green;color:white;padding:10px;z-index:99999;font-family:monospace;';
  testDiv.textContent = '✅ entry-client executing';
  document.body.appendChild(testDiv);
  setTimeout(() => testDiv.remove(), 3000);
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

const router = createBrowserRouter(routes);
console.log('[entry-client] Router created');
window.__entryClientRouterCreated = true;
if (typeof document !== 'undefined') {
  const testDiv = document.getElementById('__entryClientTest');
  if (testDiv) {
    testDiv.textContent = '✅ Router created';
    testDiv.style.background = 'blue';
  }
}

const App = () => (
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

const container = document.getElementById('root');
console.log('[entry-client] About to hydrate, container:', container);
window.__entryClientAboutToHydrate = true;
const root = window.__loadingError__ === undefined ? hydrateRoot(container!, <App />) : container;
console.log('[entry-client] Hydration complete, root:', root);
window.__entryClientHydrated = true;
if (typeof document !== 'undefined') {
  const testDiv = document.getElementById('__entryClientTest');
  if (testDiv) {
    testDiv.textContent = '✅ Hydration complete';
    testDiv.style.background = 'purple';
  }
}
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
  origConsoleError.apply(window.console, args);
};

export { root };
