import {applyMiddleware, createStore} from 'redux';
import reducer from './reducer';
import createLogger from 'redux-logger';

const logger = createLogger();

let store = createStore(
  reducer,
  applyMiddleware(logger)
);

export default store;
