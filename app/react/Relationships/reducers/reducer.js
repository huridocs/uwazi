import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';
import createReducer from 'app/BasicReducer';

import hubs from './hubsReducer';
import hubActions from './hubActionsReducer';
import uiState from './uiReducer';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default combineReducers({
  hubs,
  hubActions,
  list: combineReducers({
    entityId: createReducer('relationships/list/entityId', ''),
    entity: createReducer('relationships/list/entity', {}),
    connectionsGroups: createReducer('relationships/list/connectionsGroups', []),
    searchResults: createReducer('relationships/list/searchResults', {totalRows: 0, rows: []}),
    sort: modelReducer('relationships/list.sort', prioritySortingCriteria.get()),
    filters: createReducer('relationships/list/filters', {}),
    search: formReducer('relationships/list/search'),
    view: createReducer('relationships/list/view', 'graph')
  }),
  searchResults: createReducer('relationships/searchResults', []),
  searchTerm: createReducer('relationships/searchTerm', ''),
  connection: createReducer('relationships/connection', {}),
  uiState
});
