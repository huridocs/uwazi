/** @format */

import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import { createReducer } from '#app/BasicReducer/index.js';

import { pagesUI as ui } from './uiReducer.js';

const reducer = combineReducers({
  pageView: createReducer('page/pageView', {}),
  datasets: createReducer('page/datasets', {}),
  itemLists: createReducer('page/itemLists', []),
  error: createReducer('page/error', {}),
  data: modelReducer('page.data', { title: '', metadata: { content: '' } }),
  formState: formReducer('page.data'),
  uiState: ui,
});

export { reducer };
