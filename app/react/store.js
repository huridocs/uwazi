import {applyMiddleware, createStore} from 'redux';
import reducer from './reducer';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';

const logger = createLogger();

let store = createStore(
  reducer,
  applyMiddleware(logger),
  applyMiddleware(thunk)
);

export default store;
