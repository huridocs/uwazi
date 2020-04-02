import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  exportProcessing: createReducer('exportProcessing', false),
  exportContent: createReducer('exportContent', ''),
  exportFileName: createReducer('exportFileName', ''),
  exportError: createReducer('exportError', {}),
});
