import React from 'react';
import { actions } from '#app/BasicReducer/index.js';
import RouteHandler from '#app/App/RouteHandler.jsx';
import ResultsViewer from '#app/SemanticSearch/components/SemanticSearchResults.jsx';
import semanticSearchAPI from '#app/SemanticSearch/SemanticSearchAPI.js';

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
