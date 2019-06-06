import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Helmet from 'react-helmet';
import socket from 'app/socket';
import { RowList } from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import { selectSemanticSearchDocument, addSearchResults } from 'app/SemanticSearch/actions/actions';
import Immutable from 'immutable';
import { Translate } from 'app/I18N';
import { selectDocuments } from 'app/Library/actions/libraryActions';
import ResultsSidePanel from './ResultsSidePanel';


const sentencesAboveThreshold = (item, threshold) => {
  let count = item.getIn(['semanticSearch', 'results']).toJS().findIndex(({ score }) => score < threshold);
  count = count >= 0 ? count : item.getIn(['semanticSearch', 'results']).size;
  return {
    count,
    percentage: count / item.getIn(['semanticSearch', 'results']).size * 100
  };
};

const filterAndSortItems = (items, { threshold, minRelevantSentences }) => items.map(item =>
  item.setIn(['semanticSearch', 'aboveThreshold'], sentencesAboveThreshold(item, threshold))
)
.filter(item =>
  item.getIn(['semanticSearch', 'aboveThreshold']).count >= minRelevantSentences
)
.sort((a, b) =>
  b.getIn(['semanticSearch', 'aboveThreshold']).percentage -
      a.getIn(['semanticSearch', 'aboveThreshold']).percentage
);

export class SemanticSearchResults extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const { items, filters, isEmpty, searchTerm } = this.props;
    return Boolean(nextProps.items.size !== items.size) ||
    Boolean(nextProps.filters.threshold !== filters.threshold) ||
    Boolean(nextProps.filters.minRelevantSentences !== filters.minRelevantSentences) ||
    Boolean(nextProps.isEmpty !== isEmpty) ||
    Boolean(nextProps.searchTerm !== searchTerm);
  }

  componentWillUnmount() {
    socket.removeListener('semanticSearchUpdated', this.onSearchUpdated);
  }

  onSearchUpdated({ updatedSearch, docs }) {
    const { searchId } = this.props;
    if (updatedSearch._id === searchId) {
      this.props.addSearchResults(docs);
    }
  }

  onClick(e, doc) {
    this.props.selectSemanticSearchDocument(doc);
  }

  renderAditionalText(doc) {
    const resultsSize = doc.getIn(['semanticSearch', 'results']).size;
    const aboveThreshold = doc.getIn(['semanticSearch', 'aboveThreshold']).count;
    const { percentage } = doc.getIn(['semanticSearch', 'aboveThreshold']);

    return (
      <div className="item-metadata">
        <div className="metadata-type-text">
          <div><Translate>Sentences above threshold</Translate></div>
          <div>{aboveThreshold} out of {resultsSize} ({percentage.toFixed(2)}%)</div>
        </div>
      </div>
    );
  }

  multiEdit() {
    const { items, selectDocuments: edit } = this.props;
    edit(items);
  }

  render() {
    const { items, isEmpty, searchTerm } = this.props;
    return (
      <div className="row panels-layout">
        { isEmpty && (
          <React.Fragment>
            <p>Search not found</p>
            <Helmet title="Semantic search not found" />
          </React.Fragment>
        )}
        { !isEmpty && (
          <React.Fragment>
            <Helmet title={`${searchTerm} - Semantic search results`} />
            <main className="semantic-search-results-viewer document-viewer with-panel">
              <h3>
                <Translate>Semantic search</Translate>: { searchTerm }
              </h3>
              <button
                type="button"
                onClick={this.multiEdit}
                className="btn btn-default"
              >
                <Translate>Edit all documents that match this criteria</Translate>
              </button>
              <div className="documents-counter">
                <span className="documents-counter-label">
                  <b>{ items.size }</b> <Translate>documents</Translate>
                </span>
              </div>
              <RowList>
                {items.map((doc, index) => (
                  <Doc
                    doc={doc}
                    key={index}
                    onClick={this.onClick}
                    additionalText={this.renderAditionalText(doc)}
                  />
                  ))}
              </RowList>
            </main>
            <ResultsSidePanel />
          </React.Fragment>
        )}
      </div>
    );
  }
}

SemanticSearchResults.defaultProps = {
  searchTerm: ''
};


SemanticSearchResults.propTypes = {
  searchId: PropTypes.string,
  items: PropTypes.object.isRequired,
  isEmpty: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string,
  selectSemanticSearchDocument: PropTypes.func.isRequired,
  addSearchResults: PropTypes.func.isRequired,
  selectDocuments: PropTypes.func.isRequired,
  filters: PropTypes.object,
};

export const mapStateToProps = (state) => {
  const { search } = state.semanticSearch;
  const searchTerm = search.get('searchTerm');
  const results = search.get('results');
  const filters = state.semanticSearch.resultsFilters;
  const items = results ? filterAndSortItems(results, filters) : Immutable.fromJS([]);
  const isEmpty = Object.keys(search).length === 0;

  return {
    searchId: search.get('_id'),
    searchTerm,
    filters,
    items,
    isEmpty
  };
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    selectSemanticSearchDocument,
    addSearchResults,
    selectDocuments
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchResults);
