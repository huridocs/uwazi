import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';
import template from './controllers/Templates/templateReducer';
import templateUI from './controllers/Templates/uiReducer';
import templates from './controllers/Templates/templatesReducer';

export default combineReducers({
  form: formReducer,
  template: combineReducers({
    data: template,
    uiState: templateUI
  }),
  templates
});
