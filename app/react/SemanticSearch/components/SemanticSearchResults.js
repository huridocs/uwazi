import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Helmet from 'react-helmet';
import SidePanel from 'app/Layout/SidePanel';
import { RowList } from 'app/Layout/Lists';

function Result ({ result }) {
  const itemClassName = `item-document`;
  const itemProps = {
    className: itemClassName, onClick: () => {},
    onMouseEnter: () => {}, onMouseLeave: () => {},
    active: false, tabIndex: '1'
  };
  return (
    <RowList.Item {...itemProps}>
      <div className="item-info">
        <div className="item-name">
          Document title
        </div>
      </div>
      <div className="item-metadata">
        <dl className='metadata-type-text'>
          <dt>Sentences above threshold</dt>
          <dd>{result.toJS().results.filter(r => r.score > 0.5).length}</dd>
        </dl>
        <dl className='metadata-type-text'>
          <dt>Average sentence threshold</dt>
          <dd>{
            result.toJS().results.reduce((total, r) => total + r.score, 0) / result.toJS().results.length
          }</dd>
        </dl>
      </div>
    </RowList.Item>
  );
}


export class SemanticSearchResults extends Component {
  render() {
    const { search, results } = this.props;
    return (
      <div className="row panels-layout">
        <Helmet title={`${search.get('searchTerm')} - Semantic search results`} />
        <main className="semantic-search-results-viewer document-viewer with-panel">
          <RowList>
            {results.map((result) => (
              <Result result={result} />
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
