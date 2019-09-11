import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  search: createReducer('activitylog/search', {}),
  list: createReducer('activitylog/list', []),
});
