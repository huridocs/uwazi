import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  showImportPanel: createReducer('showImportPanel', false),
  importUploadProgress: createReducer('importUploadProgress', 0),
  importProgress: createReducer('importProgress', 0),
  importStart: createReducer('importStart', false),
  importEnd: createReducer('importEnd', false),
  importError: createReducer('importError', {}),
});
