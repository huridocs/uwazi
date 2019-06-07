import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Helmet from 'react-helmet';
import socket from 'app/socket';
import { RowList } from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import { selectSemanticSearchDocument, addSearchResults, getSearch, getMoreSearchResults } from 'app/SemanticSearch/actions/actions';
import Immutable from 'immutable';
import { Translate } from 'app/I18N';
import { multipleUpdate } from 'app/Metadata/actions/actions';
import ResultsSidePanel from './ResultsSidePanel';
import SearchDescription from 'app/Library/components/SearchDescription';

export class SemanticSearchResults extends Component {
  constructor(props) {
    super(props);
    this.state = { page: 1 };
    this.onClick = this.onClick.bind(this);
    this.onLoadMoreClick = this.onLoadMoreClick.bind(this);
    this.multiEdit = this.multiEdit.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const { items, filters, isEmpty, searchTerm } = this.props;
    return (!Immutable.is(nextProps.items, items)) ||
    Boolean(nextProps.filters.threshold !== filters.threshold) ||
    Boolean(nextProps.filters.minRelevantSentences !== filters.minRelevantSentences) ||
    Boolean(nextProps.isEmpty !== isEmpty) ||
    Boolean(nextProps.searchTerm !== searchTerm);
  }

  componentDidUpdate(prevProps) {
    const { filters, searchId } = this.props;
    if (filters.minRelevantSentences !== prevProps.filters.minRelevantSentences ||
      filters.threshold !== prevProps.filters.threshold) {
      this.props.getSearch(searchId, filters);
    }
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

  onLoadMoreClick() {
    const { searchId, filters } = this.props;
    const { page } = this.state;
    const limit = 30;
    const skip = page * limit;
    const args = { ...filters, skip, limit };
    this.setState({ page: page + 1 });
    this.props.getMoreSearchResults(searchId, args);
  }

  renderAditionalText(doc) {
    const resultsSize = doc.getIn(['semanticSearch', 'totalResults']);
    const aboveThreshold = doc.getIn(['semanticSearch', 'numRelevant']);
    const percentage = doc.getIn(['semanticSearch', 'relevantRate']) * 100;


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
    const { items, multipleUpdate: edit } = this.props;
    edit(items);
  }

  render() {
    const { items, isEmpty, searchTerm, totalCount, query } = this.props;
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
                <Translate>Semantic search</Translate>: <SearchDescription searchTerm={searchTerm} query={query.toJS()}/>
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
                  <b>{ totalCount }</b> <Translate>documents</Translate>
                </span>
              </div>
              <RowList>
                {items.map(doc => (
                  <Doc
                    doc={doc}
                    key={doc.get('sharedId')}
                    onClick={this.onClick}
                    additionalText={this.renderAditionalText(doc)}
                  />
                  ))}
              </RowList>
              <p className="col-sm-12 text-center documents-counter">
                <b> {items.size} </b> <Translate>of</Translate>
                <b> {totalCount} </b> <Translate>documents</Translate>
              </p>
              <div className="col-sm-12 text-center documents-counter">
                <button onClick={this.onLoadMoreClick} type="button" className="btn btn-default btn-load-more">
                  30 <Translate>x more</Translate>
                </button>
              </div>
            </main>
            <ResultsSidePanel />
          </React.Fragment>
        )}
      </div>
    );
  }
}

SemanticSearchResults.defaultProps = {
  searchTerm: '',
  items: Immutable.fromJS([])
};


SemanticSearchResults.propTypes = {
  searchId: PropTypes.string,
  totalCount: PropTypes.number.isRequired,
  items: PropTypes.object,
  isEmpty: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string,
  selectSemanticSearchDocument: PropTypes.func.isRequired,
  addSearchResults: PropTypes.func.isRequired,
  multipleUpdate: PropTypes.func.isRequired,
  getSearch: PropTypes.func.isRequired,
  getMoreSearchResults: PropTypes.func.isRequired,
  filters: PropTypes.object,
};

export const mapStateToProps = (state) => {
  const { search } = state.semanticSearch;
  const searchTerm = search.get('searchTerm');
  const items = search.get('results');
  const filters = state.semanticSearch.resultsFilters;
  const isEmpty = search.size === 0;

  return {
    searchId: search.get('_id'),
    query: search.get('query'),
    totalCount: isEmpty ? 0 : search.get('documents').size,
    searchTerm,
    filters,
    items,
    isEmpty
  };
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    selectSemanticSearchDocument,
    multipleUpdate,
    addSearchResults,
    getSearch,
    getMoreSearchResults,
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchResults);
