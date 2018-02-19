import {applyMiddleware, createStore, compose} from 'redux';
import reducer from './reducer';
// import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import {isClient} from 'app/utils';

let data = isClient && window.__reduxData__ ? window.__reduxData__ : {};

let store;

export default function create(initialData = data) {
  store = createStore(
    reducer,
    initialData,
    compose(
      // applyMiddleware(createLogger()),
      applyMiddleware(thunk)
    )
  );

  return store;
}

if (window && !window.store) {
  console.log('NEW ONE !!');
  window.store = create();
}

if (window) {
  store = window.store;
}


export {store};
