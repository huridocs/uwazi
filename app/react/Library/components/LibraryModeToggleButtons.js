import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { processFilters, encodeSearch } from 'app/Library/actions/libraryActions';
import { I18NLink } from 'app/I18N';

export class LibraryModeToggleButtons extends Component {
  render() {
    return (
      <div className="search-list listChart-toggleButtons">
        <div className="buttons-group">
          <I18NLink to={`/library/${this.props.searchUrl}`} className="btn btn-default">
            <i className="fa fa-th" />
          </I18NLink>
          <I18NLink to={`/library/map/${this.props.searchUrl}`} className="btn btn-default">
            <i className="fa fa-map-marker" />
          </I18NLink>
        </div>
      </div>
    );
  }
}

LibraryModeToggleButtons.propTypes = {
  searchUrl: PropTypes.string.isRequired,
};

export function mapStateToProps(state, props) {
  const params = processFilters(state[props.storeKey].search, state[props.storeKey].filters.toJS());
  encodeSearch(params);
  return {
    searchUrl: encodeSearch(params)
  };
}

export default connect(mapStateToProps)(LibraryModeToggleButtons);
