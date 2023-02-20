import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import './App/sockets';
import { App } from './App';

if (window.SENTRY_APP_DSN) {
  Sentry.init({
    release: window.UWAZI_VERSION,
    environment: window.UWAZI_ENVIRONMENT,
    dsn: window.SENTRY_APP_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}

const container = document.getElementById('root');
const root = hydrateRoot(container!, <App />);

export { root };
