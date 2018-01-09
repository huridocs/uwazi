import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import hubs from './hubsReducer';
import apiCalls from './apiCallsReducer';
import edit from './editReducer';

import uiState from './uiReducer';

export default combineReducers({
  hubs,
  apiCalls,
  edit,
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  uiState
});
