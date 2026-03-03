import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import { createReducer } from '#app/BasicReducer/index.js';

import { prioritySortingCriteria } from '#app/utils/prioritySortingCriteria.js';

const connectionsListReducer = combineReducers({
  entityId: createReducer('connectionsList/entityId', ''),
  entity: createReducer('connectionsList/entity', {}),
  connectionsGroups: createReducer('connectionsList/connectionsGroups', []),
  searchResults: createReducer('connectionsList/searchResults', { totalRows: 0, rows: [] }),
  sort: modelReducer('connectionsList.sort', prioritySortingCriteria.get()),
  filters: createReducer('connectionsList/filters', {}),
  search: formReducer('connectionsList/search'),
  view: createReducer('connectionsList/view', 'graph'),
});
export { connectionsListReducer };
