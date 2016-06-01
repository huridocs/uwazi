import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';

import ui from './uiReducer.js';

export default combineReducers({
  data: modelReducer('template.data', {name: '', properties: []}),
  formState: formReducer('template.data'),
  uiState: ui
});
