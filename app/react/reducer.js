import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';
import fields from './controllers/Templates/fieldsReducer';

export default combineReducers({
  fields: fields,
  form: formReducer
});
