/** @format */

import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  state: createReducer('oneUpReview.state', {}),
});
