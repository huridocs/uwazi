import { Field, Form, actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';
import { searchDocuments } from 'app/Library/actions/libraryActions';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import SearchTips from 'app/Library/components/SearchTips';

export class SearchBar extends Component {
  resetSearch() {
    this.props.change(`${this.props.storeKey}.search.searchTerm`, '');
    const search = Object.assign({}, this.props.search);
    search.searchTerm = '';
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  submitSearch() {
    const search = Object.assign({}, this.props.search);
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  search(search) {
    this.props.searchDocuments({ search }, this.props.storeKey);
  }

  render() {
    const { search } = this.props;
    const model = `${this.props.storeKey}.search`;
    return (
      <div className={`search-box${this.props.open ? ' is-active' : ''}`}>
        <Form model={model} onSubmit={this.search.bind(this)} autoComplete="off">
          <div className={`input-group${search.searchTerm ? ' is-active' : ''}`}>
            <Field model=".searchTerm" updateOn="submit">
              <input
                type="text"
                placeholder={t('System', 'Search', null, false)}
                className="form-control"
                autoComplete="off"
              />
              <Icon
                icon="times"
                onClick={this.resetSearch.bind(this)}
              />
            </Field>
            <Icon
              icon="search"
              onClick={this.submitSearch.bind(this)}
            />
          </div>
        </Form>
        <SearchTips />
      </div>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  open: PropTypes.bool,
  change: PropTypes.func.isRequired,
  search: PropTypes.object,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    search: state[props.storeKey].search,
    open: state[props.storeKey].ui.get('filtersPanel') && !state.library.ui.get('selectedDocument')
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    searchDocuments,
    change: formActions.change
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
