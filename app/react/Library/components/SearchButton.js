import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {showFilters, hideFilters} from 'app/Library/actions/libraryActions';
import {unselectDocument} from '../actions/libraryActions';

export class SearchButton extends Component {
  render() {
    let toggle = this.props.open ? this.props.hideFilters : this.props.showFilters;
    let activeClass = this.props.open ? ' is-active' : '';

    if (this.props.open && this.props.metadataPanelIsOpen) {
      toggle = this.props.unselectDocument;
      activeClass = '';
    }

    if (!this.props.open && this.props.metadataPanelIsOpen) {
      toggle = () => {
        this.props.showFilters();
        this.props.unselectDocument();
      };
    }

    return (
      <a href='#' className={'search-button btn ' + activeClass} onClick={toggle}>
        <div className="searchButton-open">
          <i className="fa fa-search"></i>
          <span>Search...</span>
        </div>
        <div className="searchButton-close">
          <i className="fa fa-chevron-right"></i>
        </div>
      </a>
    );
  }
}

SearchButton.propTypes = {
  showFilters: PropTypes.func,
  hideFilters: PropTypes.func,
  unselectDocument: PropTypes.func,
  open: PropTypes.bool,
  metadataPanelIsOpen: PropTypes.bool
};

export function mapStateToProps(state) {
  return {
    open: state.library.ui.get('filtersPanel'),
    metadataPanelIsOpen: !!state.library.ui.get('selectedDocument')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showFilters,
    hideFilters,
    unselectDocument
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchButton);
