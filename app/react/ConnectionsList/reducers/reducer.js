import {combineReducers} from 'redux';
import {modelReducer, formReducer} from 'react-redux-form';
import createReducer from 'app/BasicReducer';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

export default combineReducers({
  entityId: createReducer('connectionsList/entityId', ''),
  connectionsGroups: createReducer('connectionsList/connectionsGroups', []),
  searchResults: createReducer('connectionsList/searchResults', {totalRows: 0, rows: []}),
  sort: modelReducer('connectionsList.sort', prioritySortingCriteria.get()),
  filters: createReducer('connectionsList/filters', {}),
  search: formReducer('connectionsList/search')
});
