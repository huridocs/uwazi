import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

import CustomProvider from './App/Provider';
import Routes from './Routes';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    <CustomProvider>
      <BrowserRouter>{Routes}</BrowserRouter>
    </CustomProvider>
  </Provider>
);

export default App;
