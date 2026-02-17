import { combineReducers } from 'redux';
import createReducer from '#app/BasicReducer/index.js';
import { modelReducer, formReducer } from 'react-redux-form';
import { prioritySortingCriteria } from '#app/utils/prioritySortingCriteria.js';

const connectionsListReducer = combineReducers({
    entityId: createReducer('connectionsList/entityId', ''),
    connectionsGroups: createReducer('connectionsList/connectionsGroups', []),
    searchResults: createReducer('connectionsList/searchResults', { totalRows: 0, rows: [] }),
    sort: modelReducer('connectionsList.sort', prioritySortingCriteria.get()),
    filters: createReducer('connectionsList/filters', {}),
    search: formReducer('connectionsList/search'),
});
export { connectionsListReducer };  