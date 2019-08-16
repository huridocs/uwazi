import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { searchDocuments, processFilters } from 'app/Library/actions/libraryActions';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import SearchTips from 'app/Library/components/SearchTips';
import { submitNewSearch } from 'app/SemanticSearch/actions/actions';

export class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.search = this.search.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
    this.submitSearch = this.submitSearch.bind(this);
    this.submitSemanticSearch = this.submitSemanticSearch.bind(this);
  }

  resetSearch() {
    this.props.change(`${this.props.storeKey}.search.searchTerm`, '');
    const search = Object.assign({}, this.props.search);
    search.searchTerm = '';
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  submitSemanticSearch() {
    this.props.semanticSearch(this.props.search);
  }

  submitSearch() {
    const search = Object.assign({}, this.props.search);
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  search(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { search, semanticSearchEnabled, storeKey } = this.props;
    const model = `${storeKey}.search`;
    return (
      <div className="search-box">
        <Form model={model} onSubmit={this.search} autoComplete="off">
          <div className={`input-group${search.searchTerm ? ' is-active' : ''}`}>
            <Field model=".searchTerm">
              <input
                type="text"
                placeholder={t('System', 'Search', null, false)}
                className="form-control"
                autoComplete="off"
              />
              <Icon
                icon="times"
                onClick={this.resetSearch}
              />
            </Field>
            <Icon
              icon="search"
              onClick={this.submitSearch}
            />
          </div>
          {semanticSearchEnabled && (
            <button
              disabled={search.searchTerm ? '' : 'disabled'}
              type="button"
              onClick={this.submitSemanticSearch}
              className="btn btn-success semantic-search-button"
            >
              <Icon icon="flask" /> Semantic Search
            </button>
          )}
        </Form>
        <SearchTips />
      </div>
    );
  }
}

SearchBar.defaultProps = {
  semanticSearchEnabled: false
};

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  semanticSearch: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  semanticSearchEnabled: PropTypes.bool,
  search: PropTypes.object,
  storeKey: PropTypes.string.isRequired,
};

export function mapStateToProps(state, props) {
  const features = state.settings.collection.toJS().features || {};
  const search = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  return {
    search,
    semanticSearchEnabled: features.semanticSearch
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    searchDocuments,
    change: formActions.change,
    semanticSearch: submitNewSearch
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
