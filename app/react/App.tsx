import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { Provider } from 'react-redux';
import { getRoutes } from './Routes';
import CustomProvider from './App/Provider';
import { settingsAtom, templatesAtom } from './V2/atoms';
import { store } from './store';

const reduxState = store?.getState();

const settings = reduxState?.settings.collection.toJS() || {};
const templates = reduxState?.templates.toJS() || [];

const router = createBrowserRouter(getRoutes(settings, reduxState?.user.get('_id')));

const recoilGlobalState = ({ set }: MutableSnapshot) => {
  set(settingsAtom, settings);
  set(templatesAtom, templates);
};

const App = () => (
  <Provider store={store as any}>
    <CustomProvider>
      <RecoilRoot initializeState={recoilGlobalState}>
        <RouterProvider router={router} fallbackElement={null} />
      </RecoilRoot>
    </CustomProvider>
  </Provider>
);

export { App };
