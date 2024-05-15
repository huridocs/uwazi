import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './App/sockets';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { App } from './App';

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

const onRecoverableError: (incomingError: unknown) => void = incomingError => {
  if ('recoverableError' in incomingError && incomingError.recoverableError === 'NO_SSR') {
    // Ignoring the error generated by `noSSR()`.
  }

  console.log('abc');
};

const container = document.getElementById('root');
const root = hydrateRoot(container!, <App />, {
  onRecoverableError,
});

const origConsoleError = window.console.error;
const isRecoverableError = error =>
  error && typeof error === 'object' && 'recoverableError' in error && error.recoverableError;
window.console.error = (...args) => {
  if (isRecoverableError(args[0])) {
    return;
  }
  origConsoleError.apply(window.console, args);
};
window.addEventListener('error', ev => {
  if (isRecoverableError(ev.error)) {
    ev.preventDefault();
  }
});

export { root };
