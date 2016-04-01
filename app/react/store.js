import {applyMiddleware, createStore, compose} from 'redux';
import reducer from './reducer';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import {isClient} from '~/utils';
import {fromJSON} from 'transit-immutable-js';

const logger = createLogger();

let data = isClient && window.__reduxData__ ? fromJSON(window.__reduxData__) : {};

export default (initialData = data) => {
  return createStore(
    reducer,
    initialData,
    compose(applyMiddleware(logger), applyMiddleware(thunk))
  );
};
