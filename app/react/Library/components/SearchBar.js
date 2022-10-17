import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { searchDocuments, processFilters } from 'app/Library/actions/libraryActions';
import { t, Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import ModalTips from 'app/App/ModalTips';
import { SearchTipsContent } from 'app/App/SearchTipsContent';
import { submitNewSearch } from 'app/SemanticSearch/actions/actions';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';

// eslint-disable-next-line import/exports-last
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
    const search = { ...this.props.search };
    search.searchTerm = '';
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  submitSemanticSearch() {
    this.props.semanticSearch(this.props.search);
  }

  submitSearch() {
    const search = { ...this.props.search };
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  search(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { search, storeKey } = this.props;
    const model = `${storeKey}.search`;
    return (
      <div className="search-box">
        <Form model={model} onSubmit={this.search} autoComplete="off">
          <div className={`input-group${search.searchTerm ? ' is-active' : ''}`}>
            <Field model=".searchTerm">
              <input
                type="text"
                placeholder={t('System', 'Search', null, false)}
                aria-label={t('System', 'Search text description', null, false)}
                className="form-control"
                autoComplete="off"
              />
              <Icon icon="times" onClick={this.resetSearch} aria-label="Reset Search input" />
            </Field>
            <Icon icon="search" onClick={this.submitSearch} aria-label="Search button" />
          </div>
          <FeatureToggleSemanticSearch>
            <button
              disabled={search.searchTerm ? '' : 'disabled'}
              type="button"
              onClick={this.submitSemanticSearch}
              className="btn btn-success semantic-search-button"
            >
              <Icon icon="flask" /> <Translate>Semantic Search</Translate>
            </button>
          </FeatureToggleSemanticSearch>
        </Form>
        <ModalTips
          label={t('System', 'Search Tips', null, false)}
          title={t('System', 'Narrow down your searches', null, false)}
        >
          <SearchTipsContent />
        </ModalTips>
      </div>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  semanticSearch: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  search: PropTypes.object,
  storeKey: PropTypes.string.isRequired,
};

export function mapStateToProps(state, props) {
  const search = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  return {
    search,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      searchDocuments,
      change: formActions.change,
      semanticSearch: submitNewSearch,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
