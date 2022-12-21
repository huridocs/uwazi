/* eslint-disable import/no-mutable-exports,prefer-destructuring,global-require */

import { isClient } from 'app/utils';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { applyMiddleware, createStore, Store } from 'redux';
import reducer from './reducer';
import { IStore } from './istore';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  interface Window {
    __reduxData__: any;
    store: Store<IStore>;
  }
}

const data = isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store: Store<IStore> | undefined;

export default function create(initialData = data) {
  store = createStore<IStore>(reducer, initialData, composeWithDevTools(applyMiddleware(thunk)));

  return store;
}

if (module.hot) {
  if (!window.store) {
    window.store = create();
  }
  store = window.store;
  module.hot.accept('./reducer', () => {
    const rootReducer = require('./reducer');
    store!.replaceReducer(rootReducer);
  });
}

if (!store) {
  store = create();
}

if (typeof window !== 'undefined' && !module.hot) {
  window.store = store;
}

export { store };
