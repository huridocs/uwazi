import React from 'react';

import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import SearchButton from 'app/Library/components/SearchButton';

import ResultsViewer from './components/SemanticSearchResults';
import semanticSearchAPI from './SemanticSearchAPI';

export default class SemanticSearchResultsView extends RouteHandler {
  static async requestState(requestParams, state) {
    const search = await semanticSearchAPI.getSearch(requestParams, state.semanticSearch.resultsFilters);

    return [
      actions.set('semanticSearch/search', search)
    ];
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library" />
      </div>
    );
  }

  render() {
    return <ResultsViewer />;
  }
}
