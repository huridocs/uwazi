import { combineReducers } from 'redux';
import { modelReducer, formReducer } from 'react-redux-form';
import createReducer from 'app/BasicReducer';
import Immutable from 'immutable';

export default combineReducers({
  search: createReducer('semanticSearch/search', {}),
  searches: createReducer('semanticSearch/searches', []),
  resultsFiltersForm: formReducer('semanticSearch.resultsFilters'),
  resultsFilters: modelReducer('semanticSearch.resultsFilters', { threshold: 0.2, minRelevantSentences: 5, minRelevantScores: 20 }),
  resultsThreshold: modelReducer('semanticSearch.resultsThreshold'),
  minRelevantSentences: modelReducer('semanticSearch.minRelevantSentences'),
  minRelevantScore: modelReducer('semanticSearch.minRelevantScore'),
  selectedDocument: createReducer('semanticSearch/selectedDocument', Immutable.fromJS({})),
  documentSentencesTreshold: createReducer('semanticSearch/documentSentencesTreshold', 0.3),
  showSemanticSearchPanel: createReducer('semanticSearch/showSemanticSearchPanel', false),
});
