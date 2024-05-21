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
} from 'react-router-dom';
import { Provider } from 'jotai';
import { Provider as ReduxProvider } from 'react-redux';
import './App/sockets';
import { getRoutes } from './Routes';
import CustomProvider from './App/Provider';
import { settingsAtom, atomStore, userAtom } from './V2/atoms';
import { store } from './store';

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
        <RouterProvider router={router} fallbackElement={null} />
      </Provider>
    </CustomProvider>
  </ReduxProvider>
);

const container = document.getElementById('root');
const root = hydrateRoot(container!, <App />);

export { root };
