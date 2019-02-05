import React from 'react';

import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import SearchButton from 'app/Library/components/SearchButton';

import ResultsViewer from './components/SemanticSearchResults';
import semanticSearchAPI from './SemanticSearchAPI';

export default class SemanticSearchResultsView extends RouteHandler {
  static requestState({ searchId }) {
    return Promise.all([
      semanticSearchAPI.getSearch(searchId),
      semanticSearchAPI.getSearchResults(searchId)
    ]).then(([search, results]) => ({ search, results }));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('semanticSearch/search', state.search));
    this.context.store.dispatch(actions.set('semanticSearch/searchResults', state.results));
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
