/* eslint-disable import/no-mutable-exports,prefer-destructuring,global-require */

import { isClient } from './utils/index.js';
import thunkModule from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { applyMiddleware, createStore, Store, Middleware } from 'redux';

import Immutable from '../shared/immutableWrapper.js';
import reducer from './reducer.js';
import { IStore } from './istore.js';

const thunk: Middleware = ((thunkModule as { default?: Middleware }).default ||
  thunkModule) as Middleware;
const data = isClient && window.__reduxData__ ? window.__reduxData__ : {};
let store: Store<IStore> | undefined;

function hydrateImmutableFilters(preloaded: IStore): IStore {
  return (['library', 'uploads'] as const).reduce<IStore>(
    (out, key) => {
      const slice = preloaded[key];
      if (slice?.filters == null) return out;
      const raw = slice.filters as { toJS?: () => object };
      return {
        ...out,
        [key]: {
          ...slice,
          filters: Immutable.fromJS(
            typeof raw.toJS === 'function' ? raw.toJS() : raw
          ) as unknown as IStore['library']['filters'],
        },
      };
    },
    { ...preloaded }
  );
}

export default function create(initialData = data) {
  const hasFilters =
    initialData &&
    typeof initialData === 'object' &&
    (['library', 'uploads'] as const).some(key => (initialData as IStore)[key]?.filters != null);
  const hydrated = hasFilters ? hydrateImmutableFilters(initialData as IStore) : initialData;
  store = createStore<IStore>(reducer, hydrated, composeWithDevTools(applyMiddleware(thunk)));

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
