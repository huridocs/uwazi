import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  section: createReducer('users/section', 'account'),
  settings: createReducer('users/settings', {}),
  account: createReducer('users/account', {})
});
