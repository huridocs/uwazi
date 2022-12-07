import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { routes } from './Routes';
import CustomProvider from './App/Provider';
import { store } from './store';

const router = createBrowserRouter(routes);

const App = () => (
  <Provider store={store as any}>
    <CustomProvider>
      <RouterProvider router={router} fallbackElement={null} />
    </CustomProvider>
  </Provider>
);

export { App };
