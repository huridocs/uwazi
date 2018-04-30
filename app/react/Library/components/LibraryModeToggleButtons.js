import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { I18NLink } from 'app/I18N';

export class LibraryModeToggleButtons extends Component {
  render() {
    if (!this.props.showGeolocation) {
      return false;
    }
    return (
      <div className="list-view-mode">
        <div className="buttons-group">
          <I18NLink to={`library${this.props.searchUrl}`} className="btn btn-default" activeClassName="is-active">
            <i className="fa fa-th" />
          </I18NLink>
          <I18NLink to={`library/map${this.props.searchUrl}`} className="btn btn-default" activeClassName="is-active">
            <i className="fa fa-map-marker" />
          </I18NLink>
        </div>
      </div>
    );
  }
}

LibraryModeToggleButtons.propTypes = {
  searchUrl: PropTypes.string.isRequired,
  showGeolocation: PropTypes.bool.isRequired,
};

export function mapStateToProps(state, props) {
  const params = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  encodeSearch(params);
  return {
    searchUrl: encodeSearch(params),
    showGeolocation: Boolean(state.templates.find(_t => _t.get('properties').find(p => p.get('type') === 'geolocation')))
  };
}

export default connect(mapStateToProps)(LibraryModeToggleButtons);
