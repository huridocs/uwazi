import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';

import templates from '~/Templates/reducers/templatesReducer';
import template from '~/Templates/reducers/templateReducer';
import templateUI from '~/Templates/reducers/uiReducer';

export default combineReducers({
  form: formReducer,
  template: combineReducers({
    data: template,
    uiState: templateUI
  }),
  templates
});
