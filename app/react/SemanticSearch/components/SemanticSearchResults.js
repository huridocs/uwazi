import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Helmet from 'react-helmet';
import SidePanel from 'app/Layout/SidePanel';
import { RowList } from 'app/Layout/Lists';

import ResultItem from './ResultItem';

export class SemanticSearchResults extends Component {
  render() {
    const { search, results } = this.props;
    return (
      <div className="row panels-layout">
        <Helmet title={`${search.get('searchTerm')} - Semantic search results`} />
        <main className="semantic-search-results-viewer document-viewer with-panel">
          <RowList>
            {results.map(result => (
              <ResultItem result={result} />
            ))}
          </RowList>
        </main>
        <SidePanel>
          <div>test</div>
        </SidePanel>
      </div>
    );
  }
}

SemanticSearchResults.propTypes = {
  search: PropTypes.object.isRequired,
  results: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  search: state.semanticSearch.search,
  results: state.semanticSearch.searchResults
});

export default connect(mapStateToProps)(SemanticSearchResults);
