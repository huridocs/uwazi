/** @format */

import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import createReducer from 'app/BasicReducer';

import ui from './uiReducer.js';

export default combineReducers({
  pageView: createReducer('page/pageView', {}),
  datasets: createReducer('page/datasets', {}),
  itemLists: createReducer('page/itemLists', []),
  error: createReducer('page/error', {}),
  data: modelReducer('page.data', { title: '', metadata: /*non-metadata-object*/ { content: '' } }),
  formState: formReducer('page.data'),
  uiState: ui,
});
