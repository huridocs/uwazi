import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getRoutes } from './Routes';
import CustomProvider from './App/Provider';
import { settingsAtom } from './V2/atoms/settingsAtom';
import { store } from './store';

const reduxState = store?.getState();

const settings = reduxState?.settings.collection.toJS() || {};

const router = createBrowserRouter(getRoutes(settings, reduxState?.user.get('_id')));

const recoilGlobalState = ({ set }: MutableSnapshot) => {
  set(settingsAtom, settings);
};

const App = () => (
  <Provider store={store as any}>
    <DndProvider backend={HTML5Backend}>
      <CustomProvider>
        <RecoilRoot initializeState={recoilGlobalState}>
          <RouterProvider router={router} fallbackElement={null} />
        </RecoilRoot>
      </CustomProvider>
    </DndProvider>
  </Provider>
);

export { App };
