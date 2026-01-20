import { combineReducers } from 'redux';
import createReducer from '#app/BasicReducer/index.js';

import connection from '#app/Connections/reducers/connectionReducer.js';
import uiState from '#app/Connections/reducers/uiReducer.js';

export default combineReducers({
  connection,
  searchResults: createReducer('connections/searchResults', []),
  searchTerm: createReducer('connections/searchTerm', ''),
  uiState,
});
