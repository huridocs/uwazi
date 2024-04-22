import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { createStore, Provider } from 'jotai';
import { Provider as ReduxProvider } from 'react-redux';
import { getRoutes } from './Routes';
import CustomProvider from './App/Provider';
import { settingsAtom, templatesAtom, translationsAtom } from './V2/atoms';
import { store } from './store';

const reduxState = store?.getState();

const settings = reduxState?.settings.collection.toJS() || {};
const templates = reduxState?.templates.toJS() || [];

const router = createBrowserRouter(getRoutes(settings, reduxState?.user.get('_id')));

const atomStore = createStore();
atomStore.set(settingsAtom, settings);
atomStore.set(templatesAtom, templates);
atomStore.set(translationsAtom, { translations: [], locale: reduxState?.locale || 'en' });

const App = () => (
  <ReduxProvider store={store as any}>
    <CustomProvider>
      <Provider store={atomStore}>
        <RouterProvider router={router} fallbackElement={null} />
      </Provider>
    </CustomProvider>
  </ReduxProvider>
);

export { App };
