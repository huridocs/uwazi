import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  section: createReducer('users/section', 'account'),
  form: modelReducer('users.form', {username: '', password: ''}),
  formState: formReducer('users.form')
});
