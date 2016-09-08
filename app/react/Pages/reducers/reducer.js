import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';

import ui from './uiReducer.js';

export default combineReducers({
  data: modelReducer('page.data', {title: '', metadata: []}),
  formState: formReducer('page.data'),
  uiState: ui
});
