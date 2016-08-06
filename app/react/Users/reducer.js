import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  form: modelReducer('login.form', {username: '', password: ''}),
  formState: formReducer('login.form')
});
