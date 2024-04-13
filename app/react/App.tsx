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

const atomsGlobalState = () => {
  const myStore = createStore();
  myStore.set(settingsAtom, settings);
  myStore.set(templatesAtom, templates);
  myStore.set(translationsAtom, { locale: reduxState?.locale || 'en' });
  return myStore;
};

const App = () => (
  <ReduxProvider store={store as any}>
    <CustomProvider>
      <Provider store={atomsGlobalState()}>
        <RouterProvider router={router} fallbackElement={null} />
      </Provider>
    </CustomProvider>
  </ReduxProvider>
);

export { App };
