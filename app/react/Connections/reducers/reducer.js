import { combineReducers } from 'redux';
import createReducer from '#app/BasicReducer/index.js';

import connection from './connectionReducer.js';
import uiState from './uiReducer.js';

export default combineReducers({
  connection,
  searchResults: createReducer('connections/searchResults', []),
  searchTerm: createReducer('connections/searchTerm', ''),
  uiState,
});
