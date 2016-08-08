import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {Field, Form, actions as formActions} from 'react-redux-form';

import {showFilters, hideFilters} from 'app/Library/actions/libraryActions';

export class SearchButton extends Component {
  render() {
    let toggle = this.props.open ? this.props.hideFilters : this.props.showFilters;
    return (
      <a href='#' className={'search-button btn ' + (this.props.open ? ' is-active' : '')} onClick={toggle}>
        <i className="fa fa-search"></i>
        <i className="fa fa-chevron-right"></i>
      </a>
    );
  }
}

SearchButton.propTypes = {
  showFilters: PropTypes.func,
  hideFilters: PropTypes.func,
  open: PropTypes.bool
};

export function mapStateToProps(state) {
  return {
    open: state.library.ui.get('filtersPanel')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showFilters,
    hideFilters
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchButton);
