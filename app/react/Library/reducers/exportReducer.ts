import { combineReducers } from 'redux';
import { createReducer } from '#app/BasicReducer/index.js';

const exportReducer = combineReducers({
  exportSearchResultsProcessing: createReducer('exportSearchResultsProcessing', false),
  exportSearchResultsContent: createReducer('exportSearchResultsContent', ''),
  exportSearchResultsFileName: createReducer('exportSearchResultsFileName', ''),
});

export { exportReducer };
