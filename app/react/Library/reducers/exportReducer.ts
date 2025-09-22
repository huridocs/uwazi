import { combineReducers } from 'redux';
import createReducer from '../../BasicReducer/index.js';

export default combineReducers({
  exportSearchResultsProcessing: createReducer('exportSearchResultsProcessing', false),
  exportSearchResultsContent: createReducer('exportSearchResultsContent', ''),
  exportSearchResultsFileName: createReducer('exportSearchResultsFileName', ''),
});
