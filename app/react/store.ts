/* eslint-disable import/no-mutable-exports,prefer-destructuring,global-require */

import { isClient } from '#app/utils/index.js';
import thunkModule from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { applyMiddleware, createStore, Store, Middleware } from 'redux';

import reducer from '#app/reducer.js';
import { IStore } from './istore';

const thunk: Middleware = ((thunkModule as { default?: Middleware }).default || thunkModule) as Middleware;
const data = isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store: Store<IStore> | undefined;

export default function create(initialData = data) {
  store = createStore<IStore>(reducer, initialData, composeWithDevTools(applyMiddleware(thunk)));

  return store;
}

if (import.meta.webpackHot) {
  if (!window.store) {
    window.store = create();
  }
  store = window.store;
  import.meta.webpackHot.accept('./reducer.js', async () => {
    const rootReducer = await import('./reducer.js');
    store!.replaceReducer(rootReducer.default);
  });
}

if (!store) {
  store = create();
}

if (typeof window !== 'undefined' && !import.meta.webpackHot) {
  window.store = store;
}

export { store };
