import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { routes } from './Routes';
import CustomProvider from './App/Provider';
import { store } from './store';

const router = createBrowserRouter(routes);

const App = (
  <Provider store={store}>
    <CustomProvider>
      <RouterProvider router={router} fallbackElement={null} />
    </CustomProvider>
  </Provider>
);

export default App;
