import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';
import fields from './controllers/Templates/fieldsReducer';
import templates from './controllers/Templates/templatesReducer';

export default combineReducers({
  form: formReducer,
  fields,
  templates
});
