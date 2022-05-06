import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Helmet } from 'react-helmet';
import { RowList } from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import * as semanticSearchActions from 'app/SemanticSearch/actions/actions';
import Immutable from 'immutable';
import { Translate, t } from 'app/I18N';
import SearchDescription from 'app/Library/components/SearchDescription';
import { Icon } from 'UI';
import ResultsSidePanel from './ResultsSidePanel';
import SemanticSearchMultieditPanel from './SemanticSearchMultieditPanel';

function renderAditionalText(doc) {
  const resultsSize = doc.getIn(['semanticSearch', 'totalResults']);
  const aboveThreshold = doc.getIn(['semanticSearch', 'numRelevant']);
  const percentage = doc.getIn(['semanticSearch', 'relevantRate']) * 100;

  return (
    <div className="item-metadata">
      <div className="metadata-type-text">
        <div>
          <Translate>Sentences above threshold</Translate>
        </div>
        <div>
          {aboveThreshold} <Translate>out of</Translate> {resultsSize} ({percentage.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
}

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
    return (
      !Immutable.is(nextProps.items, items) ||
      Boolean(nextProps.filters.threshold !== filters.threshold) ||
      Boolean(nextProps.filters.minRelevantSentences !== filters.minRelevantSentences) ||
      Boolean(nextProps.isEmpty !== isEmpty) ||
      Boolean(nextProps.searchTerm !== searchTerm)
    );
  }

  componentDidUpdate(prevProps) {
    const { filters, searchId } = this.props;
    if (
      filters.minRelevantSentences !== prevProps.filters.minRelevantSentences ||
      filters.threshold !== prevProps.filters.threshold
    ) {
      this.props.getSearch(searchId, filters);
    }
  }

  onClick(_e, doc) {
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

  multiEdit() {
    const { editSearchEntities: edit, filters, searchId } = this.props;
    edit(searchId, filters);
  }

  render() {
    const { items, isEmpty, searchTerm, totalCount, query, searchId } = this.props;
    return (
      <div className="row panels-layout">
        {isEmpty && (
          <>
            <p>
              <Translate>Search not found</Translate>
            </p>
            <Helmet>
              <title>{t('System', 'Search not found', null, false)}</title>
            </Helmet>
          </>
        )}
        {!isEmpty && (
          <>
            <Helmet>
              <title>{`${searchTerm} - Semantic search results`}</title>
            </Helmet>
            <main className="semantic-search-results-viewer document-viewer with-panel">
              <div>
                <h3>
                  <Translate>Semantic search</Translate>:{' '}
                  <SearchDescription searchTerm={searchTerm} query={query} />
                </h3>
                <button
                  type="button"
                  onClick={this.multiEdit}
                  className="btn btn-success edit-semantic-search"
                >
                  <Icon icon="pencil-alt" />
                  &nbsp;
                  <Translate>Edit all documents matching this criteria</Translate>
                </button>
              </div>
              <div className="documents-counter">
                <span className="documents-counter-label">
                  <b>{totalCount}</b> <Translate>documents</Translate>
                </span>
              </div>
              <RowList>
                {items.map(doc => (
                  <Doc
                    doc={doc}
                    key={doc.get('sharedId')}
                    onClick={this.onClick}
                    additionalText={renderAditionalText(doc)}
                  />
                ))}
              </RowList>
              <p className="col-sm-12 text-center documents-counter">
                <b> {items.size} </b> <Translate>of</Translate>
                <b> {totalCount} </b> <Translate>documents</Translate>
              </p>
              <div className="col-sm-12 text-center documents-counter">
                <button
                  onClick={this.onLoadMoreClick}
                  type="button"
                  className="btn btn-default btn-load-more"
                >
                  <span no-translate>30</span> <Translate>x more</Translate>
                </button>
              </div>
            </main>
            <ResultsSidePanel />
            <SemanticSearchMultieditPanel
              searchId={searchId}
              formKey="semanticSearch.multipleEdit"
            />
          </>
        )}
      </div>
    );
  }
}

SemanticSearchResults.defaultProps = {
  searchTerm: '',
  items: Immutable.fromJS([]),
  query: { searchTerm: '' },
  searchId: '',
};

SemanticSearchResults.propTypes = {
  searchId: PropTypes.string,
  totalCount: PropTypes.number.isRequired,
  items: PropTypes.instanceOf(Immutable.List),
  isEmpty: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string,
  selectSemanticSearchDocument: PropTypes.func.isRequired,
  addSearchResults: PropTypes.func.isRequired,
  editSearchEntities: PropTypes.func.isRequired,
  getSearch: PropTypes.func.isRequired,
  getMoreSearchResults: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    minRelevantSentences: PropTypes.number,
    threshold: PropTypes.number,
  }).isRequired,
  query: PropTypes.shape({
    searchTerm: PropTypes.string,
  }),
};

export const mapStateToProps = state => {
  const { search } = state.semanticSearch;
  const searchTerm = search.get('searchTerm');
  const items = search.get('results');
  const filters = state.semanticSearch.resultsFilters;
  const isEmpty = search.size === 0;
  const { _id, query } = search.toJS();

  return {
    searchId: _id,
    query: query || { searchTerm: '' },
    totalCount: isEmpty ? 0 : search.get('documents').size,
    searchTerm,
    filters,
    items,
    isEmpty,
  };
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(semanticSearchActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchResults);
