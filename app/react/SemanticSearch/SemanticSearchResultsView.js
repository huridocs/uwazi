import React from 'react';
import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import ResultsViewer from './components/SemanticSearchResults';
import semanticSearchAPI from './SemanticSearchAPI';

export default class SemanticSearchResultsView extends RouteHandler {
  static async requestState(requestParams, state) {
    const filters = state.semanticSearch
      ? state.semanticSearch.resultsFilters
      : { threshold: 0.4, minRelevantSentences: 5 };
    const args = requestParams.add(filters);
    const search = await semanticSearchAPI.getSearch(args);
    return [actions.set('semanticSearch/search', search)];
  }

  render() {
    return <ResultsViewer />;
  }
}
