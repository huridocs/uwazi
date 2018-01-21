import {combineReducers} from 'redux';
import createReducer from 'app/BasicReducer';

import hubs from './hubsReducer';
import hubActions from './hubActionsReducer';

import uiState from './uiReducer';

export default combineReducers({
  hubs,
  hubActions,
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  uiState
});
