import { combineReducers } from 'redux';
import { createReducer } from '#app/BasicReducer/index.js';

import { connectionReducer as connection } from './connectionReducer.js';
import { uiReducer as uiState } from './uiReducer.js';

const reducer = combineReducers({
  connection,
  searchResults: createReducer('connections/searchResults', []),
  searchTerm: createReducer('connections/searchTerm', ''),
  uiState,
});

export { reducer };
