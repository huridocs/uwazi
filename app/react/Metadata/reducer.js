import { combineReducers } from 'redux';
import progressReducer from './reducers/progressReducer.js';

const reducer = combineReducers({
  progress: progressReducer,
});

export { reducer };
