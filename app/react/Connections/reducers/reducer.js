import { combineReducers } from 'redux';
import createReducer from '../../BasicReducer/index.js';

import connection from './connectionReducer';
import uiState from './uiReducer';

export default combineReducers({
  connection,
  searchResults: createReducer('connections/searchResults', []),
  searchTerm: createReducer('connections/searchTerm', ''),
  uiState,
});
