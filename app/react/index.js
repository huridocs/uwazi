import React from 'react';
import ReactDOM from 'react-dom';

import * as Sentry from '@sentry/react';

import { BrowserTracing } from '@sentry/tracing';

import { AppContainer } from 'react-hot-loader';

import App from './App';

import './App/sockets';

if (window.SENTRY_APP_DSN) {
  Sentry.init({
    release: window.UWAZI_VERSION,
    environment: window.UWAZI_ENVIRONMENT,
    dsn: window.SENTRY_APP_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}

const render = Component => {
  ReactDOM.hydrate(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

render(App);

if (module.hot) {
  module.hot.accept('./App', () => {
    const nextApp = require('./App');
    render(nextApp);
  });
}
