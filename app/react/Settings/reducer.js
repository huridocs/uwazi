import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';
import {modelReducer, formReducer} from 'react-redux-form';

export default combineReducers({
  section: createReducer('settings/section', 'account'),
  collection: createReducer('settings/collection', {}),
  form: modelReducer('account.form', {username: '', password: ''}),
  formState: formReducer('account.form')
});
