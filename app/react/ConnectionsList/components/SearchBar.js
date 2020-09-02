import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Field, Form, actions as formActions } from 'react-redux-form';

import debounce from 'app/utils/debounce';
import { t } from 'app/I18N';
import { Icon } from 'UI';

import { searchReferences } from '../actions/actions';

export class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.changeSearchTerm = debounce(this.props.searchReferences, 400);
  }

  componentDidUpdate(prevProps) {
    if (this.props.entityId !== prevProps.entityId) {
      this.resetSearchTerm();
    }
  }

  componentWillUnmount() {
    this.resetSearchTerm();
  }

  resetSearchTerm() {
    this.props.change('relationships/list/search.searchTerm', '');
  }

  resetSearch() {
    this.resetSearchTerm();
    this.props.searchReferences();
  }

  render() {
    const { search } = this.props;
    const searchTerm = search.searchTerm && search.searchTerm.value ? search.searchTerm.value : '';

    return (
      <div className="search-box">
        <Form
          model="relationships/list/search"
          onSubmit={this.props.searchReferences}
          autoComplete="off"
        >
          <div className={`input-group${searchTerm ? ' is-active' : ''}`}>
            <Field model="relationships/list/search.searchTerm">
              <Icon icon="search" />
              <input
                type="text"
                placeholder={t('System', 'Search related entities or documents', null, false)}
                className="form-control"
                onChange={this.changeSearchTerm.bind(this)}
                autoComplete="off"
                value={searchTerm}
              />
              <Icon icon="times" onClick={this.resetSearch.bind(this)} />
            </Field>
          </div>
        </Form>
      </div>
    );
  }
}

SearchBar.propTypes = {
  searchReferences: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  search: PropTypes.object,
  entityId: PropTypes.string,
};

export function mapStateToProps({ relationships }) {
  const { entityId, search } = relationships.list;
  return {
    entityId,
    search,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchReferences,
      change: formActions.change,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
