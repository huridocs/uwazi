import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  section: createReducer('users/section', 'account'),
  user: createReducer('users/user', {})
});
