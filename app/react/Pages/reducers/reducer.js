import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';
import createReducer from 'app/BasicReducer';

import ui from './uiReducer.js';

export default combineReducers({
  pageView: createReducer('page/pageView', {}),
  data: modelReducer('page.data', {title: '', metadata: {}}),
  formState: formReducer('page.data'),
  uiState: ui
});
