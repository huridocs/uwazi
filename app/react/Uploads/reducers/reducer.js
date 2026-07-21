import { combineReducers } from 'redux';
import { progressReducer as progress } from '#app/Uploads/reducers/progressReducer.js';

export default combineReducers({
  progress,
});
