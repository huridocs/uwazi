import {Provider} from 'react-redux';
import {Router, browserHistory} from 'react-router';
import React from 'react';

import CustomProvider from './App/Provider';
import Routes from './Routes';
import {store} from './store.js';

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

//import './sockets';
