import {applyMiddleware, createStore, compose} from 'redux';
import reducer from './reducer';
 //import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import {isClient} from 'app/utils';

 //const logger = createLogger();

let data = isClient && window.__reduxData__ ? window.__reduxData__ : {};

let store;

export default function create(initialData = data) {
  store = createStore(
    reducer,
    initialData,
    compose(
       //applyMiddleware(logger),
      applyMiddleware(thunk)
    )
  );

  return store;
}

if (!store) {
  store = create();
}


export {store};
