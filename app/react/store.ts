/* eslint-disable import/no-mutable-exports,prefer-destructuring,global-require */

// @ts-expect-error TS(2307): Cannot find module '../../api/utils/index.js' or i... Remove this comment to see the full error message
import { isClient } from 'api/utils/index.js';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import { applyMiddleware, createStore, Store } from 'redux';
import reducer from './reducer.js';
import { IStore } from './istore';

const data = isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store: Store<IStore> | undefined;

export default function create(initialData = data) {
  store = createStore<IStore>(reducer, initialData, composeWithDevTools(applyMiddleware(thunk)));

  return store;
}

// @ts-expect-error TS(2339): Property 'hot' does not exist on type 'NodeModule'... Remove this comment to see the full error message
if (module.hot) {
  if (!window.store) {
    window.store = create();
  }
  store = window.store;
  // @ts-expect-error TS(2339): Property 'hot' does not exist on type 'NodeModule'... Remove this comment to see the full error message
  module.hot.accept('./reducer', () => {
    const rootReducer = require('./reducer');
    store!.replaceReducer(rootReducer);
  });
}

if (!store) {
  store = create();
}

// @ts-expect-error TS(2339): Property 'hot' does not exist on type 'NodeModule'... Remove this comment to see the full error message
if (typeof window !== 'undefined' && !module.hot) {
  window.store = store;
}

export { store };
