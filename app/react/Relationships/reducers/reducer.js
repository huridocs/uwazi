import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import hubs from './hubsReducer';
import edit from './editReducer';

import uiState from './uiReducer';

export default combineReducers({
  hubs,
  edit,
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  uiState
});
