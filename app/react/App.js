import React from 'react';
import { Provider } from 'react-redux';
import CustomProvider from './App/Provider';
import { routes } from './Routes';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    <CustomProvider>{routes}</CustomProvider>
  </Provider>
);

export default App;
