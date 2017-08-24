import React from 'react';
import {render} from 'react-dom';
import {browserHistory} from 'react-router';
import {Router} from 'react-router';
import Routes from './Routes';
import {Provider} from 'react-redux';
import CustomProvider from './App/Provider';
import store from './store';

render(
  <Provider store={store()}>
    <CustomProvider>
      <Router history={browserHistory}>{Routes}</Router>
    </CustomProvider>
  </Provider>,
  document.getElementById('root')
);

import './sockets';
