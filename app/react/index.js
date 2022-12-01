import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import './App/sockets';
import { store } from 'app/store';
import { fromJS } from 'immutable';
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

const globalResources = store?.getState() || {};
const globalResources1 = Object.keys(globalResources).reduce(
  (accum, k) => ({ ...accum, [k]: fromJS(globalResources[k]) }),
  {}
);

if (globalResources.settings) {
  globalResources1.settings = { collection: fromJS(globalResources.settings.collection) };
}
const root = hydrateRoot(container, <App />);

export { root };
