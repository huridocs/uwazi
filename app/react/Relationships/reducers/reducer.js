import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import hubs from './hubsReducer';

import uiState from './uiReducer';

export default combineReducers({
  hubs,
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  uiState
});
