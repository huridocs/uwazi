import React from 'react';
import ReactDOM from 'react-dom';
import {browserHistory} from 'react-router';
import {Router} from 'react-router';
import Routes from './Routes';
import {Provider} from 'react-redux';
import CustomProvider from './App/Provider';
import store from './store';
import {AppContainer} from 'react-hot-loader';

const App = () => {
  return (
    <Provider store={store()}>
      <CustomProvider>
        <Router history={browserHistory}>{Routes}</Router>
      </CustomProvider>
    </Provider>
  );
};

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <App/>
    </AppContainer>,
    document.getElementById('root')
  );
};

render();
if (module.hot) {
  module.hot.accept();
}

import './sockets';

