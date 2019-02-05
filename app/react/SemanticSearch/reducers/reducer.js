import { combineReducers } from 'redux';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  search: createReducer('semanticSearch/search', {}),
  searchResults: createReducer('semanticSearch/searchResults', [])
});
