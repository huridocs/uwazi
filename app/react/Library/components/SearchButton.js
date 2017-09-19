import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {t} from 'app/I18N';

import {showFilters, hideFilters} from 'app/Library/actions/libraryActions';
import {wrapDispatch} from 'app/Multireducer';
import {unselectAllDocuments} from '../actions/libraryActions';

export class SearchButton extends Component {
  render() {
    let toggle = this.props.open ? this.props.hideFilters : this.props.showFilters;
    let activeClass = this.props.open ? ' is-active' : '';

    if (this.props.open && this.props.metadataPanelIsOpen) {
      toggle = this.props.unselectAllDocuments;
      activeClass = '';
    }

    if (!this.props.open && this.props.metadataPanelIsOpen) {
      toggle = () => {
        this.props.showFilters();
        this.props.unselectAllDocuments();
      };
    }

    return (
      <a href='#' className={'search-button btn ' + activeClass} onClick={toggle}>
        <div className="searchButton-open">
          <i className="fa fa-search"></i>
          <span>{t('System', 'Search')}...</span>
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
  unselectAllDocuments: PropTypes.func,
  open: PropTypes.bool,
  metadataPanelIsOpen: PropTypes.bool
};

SearchButton.contextTypes = {
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    open: state[props.storeKey].ui.get('filtersPanel') !== false,
    metadataPanelIsOpen: state[props.storeKey].ui.get('selectedDocuments').size > 0
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    showFilters,
    hideFilters,
    unselectAllDocuments
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchButton);
