import React from 'react';
import { Provider } from 'react-redux';
import { routes } from './AppV2/Routes/Routes';
import CustomProvider from './App/Provider';
import { store } from './store';

const App = () => (
  <Provider store={store}>
    <CustomProvider>{routes}</CustomProvider>
  </Provider>
);

export default App;
