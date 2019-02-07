import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import Helmet from 'react-helmet';
import SidePanel from 'app/Layout/SidePanel';
import { RowList } from 'app/Layout/Lists';

import ResultItem from './ResultItem';

export class SemanticSearchResults extends Component {
  render() {
    const { search } = this.props;
    return (
      <div className="row panels-layout">
        { search.isEmpty() &&
          <React.Fragment>
            <p>Search not found</p>
            <Helmet title="Semantic search not found" />
          </React.Fragment>
        }
        { !search.isEmpty() &&
          <React.Fragment>
            <Helmet title={`${search.get('searchTerm')} - Semantic search results`} />
            <main className="semantic-search-results-viewer document-viewer with-panel">
              <RowList>
                {search.get('results').map(result => (
                  <ResultItem result={result} key={result.sharedId} />
                ))}
              </RowList>
            </main>
            <SidePanel>
              <div>test</div>
            </SidePanel>
          </React.Fragment>
        }
      </div>
    );
  }
}

SemanticSearchResults.propTypes = {
  search: PropTypes.instanceOf(Map).isRequired
};

const mapStateToProps = state => ({
  search: state.semanticSearch.search
});

export default connect(mapStateToProps)(SemanticSearchResults);
