import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  exportSearchResultsProcessing: createReducer('exportSearchResultsProcessing', false),
  exportSearchResultsContent: createReducer('exportSearchResultsContent', ''),
  exportSearchResultsFileName: createReducer('exportSearchResultsFileName', ''),
});
