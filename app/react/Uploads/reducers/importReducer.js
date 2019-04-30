import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  showImportPanel: createReducer('showImportPanel', false)
});
