import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import connection from './connectionReducer';
import uiState from './uiReducer';

export default combineReducers({
  connection,
  searchResults: createReducer('connections/searchResults', []),
  uiState
});
