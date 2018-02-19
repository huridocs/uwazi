import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import App from './App.js';

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

render(App);

if (module.hot) {
  module.hot.accept('./App', () => {
    const nextApp = require('./App.js');
    render(nextApp);
  });
  //module.hot.accept('./store', () => {});
  //module.hot.accept('./sockets', () => {});
  module.hot.accept('./store', () => {
    console.log('STORE !!!');
    const rootReducer = require('./reducer');
    window.store.replaceReducer(rootReducer);
  });
  //module.hot.accept('./reducer', () => {});
  module.hot.accept('./reducer', () => {
    console.log('REDUCER !!!');
    const rootReducer = require('./reducer');
    window.store.replaceReducer(rootReducer);
  });
  //module.hot.accept('./reducer', () => {});
  //module.hot.accept('./', () => {
  //const rootReducer = require('./reducer');
  //console.log(rootReducer);
  //});
}


