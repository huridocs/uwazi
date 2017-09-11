import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';

import {resetFilters} from 'app/Library/actions/filterActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import SidePanel from 'app/Layout/SidePanel';
import {t} from 'app/I18N';

export class LibraryFilters extends Component {

  reset() {
    this.props.resetFilters(this.props.storeKey);
  }

  render() {
    return (
      <SidePanel className="library-filters" open={this.props.open}>
        <div className="sidepanel-footer">
          <span onClick={this.reset.bind(this)} className="btn btn-primary">
            <i className="fa fa-refresh"></i>
            <span className="btn-label">{t('System', 'Reset')}</span>
          </span>
          <button type="submit" form="filtersForm" className="btn btn-success">
            <i className="fa fa-search"></i>
            <span className="btn-label">{t('System', 'Search')}</span>
          </button>
        </div>
        <div className="sidepanel-body">
          <p className="sidepanel-title">{t('System', 'Filters')}</p>
          <div className="documentTypes-selector nested-selector">
            <DocumentTypesList storeKey={this.props.storeKey}/>
          </div>
          <FiltersForm storeKey={this.props.storeKey}/>
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func,
  open: PropTypes.bool,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    open: state[props.storeKey].ui.get('filtersPanel') !== false && !state[props.storeKey].ui.get('selectedDocuments').size > 0
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({resetFilters}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
