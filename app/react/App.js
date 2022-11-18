import { Provider } from 'react-redux';

import React from 'react';

import CustomProvider from './App/Provider';
import Routes from './Routes';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    <CustomProvider>{Routes}</CustomProvider>
  </Provider>
);

export default App;
