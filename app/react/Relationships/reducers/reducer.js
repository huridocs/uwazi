import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import { createReducer } from '#app/BasicReducer/index.js';
import { prioritySortingCriteria } from '#app/utils/prioritySortingCriteria.js';
import { hubsReducer as hubs } from './hubsReducer.js';
import { hubActionsReducer as hubActions } from './hubActionsReducer.js';
import { uiReducer as uiState } from './uiReducer.js';

const reducer = combineReducers({
  hubs,
  hubActions,
  list: combineReducers({
    sharedId: createReducer('relationships/list/sharedId', ''),
    entity: createReducer('relationships/list/entity', {}),
    connectionsGroups: createReducer('relationships/list/connectionsGroups', []),
    searchResults: createReducer('relationships/list/searchResults', { totalRows: 0, rows: [] }),
    sort: modelReducer('relationships/list.sort', prioritySortingCriteria.get()),
    filters: createReducer('relationships/list/filters', {}),
    search: formReducer('relationships/list/search'),
    view: createReducer('relationships/list/view', 'graph'),
  }),
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  connection: createReducer('relationships/connection', {}),
  uiState,
  metadata: modelReducer('relationships.metadata', {}),
  formState: formReducer('relationships.metadata'),
});

export { reducer };
