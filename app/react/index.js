import React from 'react';
import ReactDOM from 'react-dom';

import { AppContainer } from 'react-hot-loader';

import App from './App';

import './App/sockets';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: 'https://9fc1606d2d884615ad395eb38bde0fbe@o1134623.ingest.sentry.io/6182268',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

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
