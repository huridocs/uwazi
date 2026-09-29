/* eslint-disable import/no-mutable-exports,prefer-destructuring,global-require */

import { isClient } from './utils/index.js';
import thunkModule from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { AnyAction, applyMiddleware, createStore, Middleware, Reducer, Store } from 'redux';

import { rootReducer as reducer } from './reducer.js';
import { IStore } from './istore.js';
import { AppDispatch } from './thunkDispatch.js';

type AppStore = Omit<Store<IStore, AnyAction>, 'dispatch'> & { dispatch: AppDispatch };

const thunk: Middleware = ((thunkModule as { default?: Middleware }).default ||
  thunkModule) as Middleware;
const data = isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store: AppStore | undefined;

function create(initialData: IStore = data as IStore): AppStore {
  store = createStore(
    reducer as unknown as Reducer<IStore, AnyAction>,
    initialData,
    composeWithDevTools(applyMiddleware(thunk))
  ) as AppStore;
  return store;
}

if (import.meta.webpackHot) {
  if (!window.store) {
    window.store = create();
  }
  store = window.store;
  import.meta.webpackHot.accept('./reducer.js', async () => {
    const rootReducer = await import('./reducer.js');
    store!.replaceReducer(
      (rootReducer as { rootReducer: typeof reducer }).rootReducer as unknown as Reducer<
        IStore,
        AnyAction
      >
    );
  });
}

if (!store) {
  store = create();
}

if (typeof window !== 'undefined' && !import.meta.webpackHot) {
  window.store = store!;
}

export { create, store };
