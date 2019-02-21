import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import createReducer from 'app/BasicReducer';

export default combineReducers({
  search: createReducer('semanticSearch/search', {}),
  resultsFiltersForm: formReducer('semanticSearch.resultsFilters'),
  resultsFilters: modelReducer('semanticSearch.resultsFilters'),
  resultsThreshold: modelReducer('semanticSearch.resultsThreshold'),
  minRelevantSentences: modelReducer('semanticSearch.minRelevantSentences'),
  minRelevantScore: modelReducer('semanticSearch.minRelevantScore')
});
