import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  section: createReducer('users/section', 'account'),
  user: createReducer('users/user', {}),
  form: modelReducer('login.form', {username: '', password: ''}),
  formState: formReducer('login.form')
});
