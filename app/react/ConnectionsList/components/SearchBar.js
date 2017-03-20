import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Field, Form, actions as formActions} from 'react-redux-form';

import debounce from 'app/utils/debounce';
import {t} from 'app/I18N';

import {searchReferences} from '../actions/actions';

export class SearchBar extends Component {

  resetSearchTerm() {
    this.props.change('connectionsList/search.searchTerm', '');
  }

  resetSearch() {
    this.resetSearchTerm();
    this.props.searchReferences();
  }

  componentWillMount() {
    this.changeSearchTerm = debounce(this.props.searchReferences, 400);
  }

  componentWillUnmount() {
    this.resetSearchTerm();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entityId !== nextProps.entityId) {
      this.resetSearchTerm();
    }
  }

  render() {
    const {search} = this.props;
    const searchTerm = search.searchTerm && search.searchTerm.value ? search.searchTerm.value : '';

    return (
      <div className="search-box">
        <Form model="connectionsList/search" onSubmit={this.props.searchReferences} autoComplete="off">
          <div className={'input-group' + (searchTerm ? ' is-active' : '')}>
            <Field model="connectionsList/search.searchTerm">
              <i className="fa fa-search"></i>
              <input
                type="text"
                placeholder={t('System', 'Search connections')}
                className="form-control"
                onChange={this.changeSearchTerm.bind(this)}
                autoComplete="off"
                value={searchTerm}
              />
              <i className="fa fa-close" onClick={this.resetSearch.bind(this)}></i>
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
  entityId: PropTypes.string
};

export function mapStateToProps({connectionsList}) {
  const {entityId, search} = connectionsList;
  return {
    entityId,
    search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    searchReferences,
    change: formActions.change
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
