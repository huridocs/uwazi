import React from 'react';
import {browserHistory} from 'react-router';
import {Router} from 'react-router';
import Routes from './Routes';
import {Provider} from 'react-redux';
import CustomProvider from './App/Provider';
import {store} from './store';
import './sockets';

const App = () => {
  return (
    <Provider store={store}>
      <CustomProvider>
        <Router history={browserHistory}>{Routes}</Router>
      </CustomProvider>
    </Provider>
  );
};

export default App;
