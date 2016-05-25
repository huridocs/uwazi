import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';

import template from './templateReducer.js';
import ui from './uiReducer.js';

export default combineReducers({
  model: modelReducer('template.model', {name: '', properties: []}),
  formState: formReducer('template.model'),
  data: template,
  uiState: ui
});
