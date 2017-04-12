import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {resetFilters} from 'app/Library/actions/filterActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import SearchBar from 'app/Library/components/SearchBar';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import SidePanel from 'app/Layout/SidePanel';
import {t} from 'app/I18N';

export class LibraryFilters extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <SidePanel className="library-filters" open={this.props.open}>
        <div className="sidepanel-footer">
          <span onClick={this.props.resetFilters} className="btn btn-primary">
            <i className="fa fa-refresh"></i>
            <span className="btn-label">{t('System', 'Reset')}</span>
          </span>
          <button type="submit" form="filtersForm" className="btn btn-success">
            <i className="fa fa-search"></i>
            <span className="btn-label">{t('System', 'Search')}</span>
          </button>
        </div>
        <div className="sidepanel-body">
          <SearchBar />
          <div className="documentTypes-selector nested-selector">
            <DocumentTypesList uploadsSection={this.props.uploadsSection}/>
          </div>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func,
  open: PropTypes.bool,
  uploadsSection: PropTypes.bool
};

export function mapStateToProps({library}) {
  return {
    open: library.ui.get('filtersPanel') && !library.ui.get('selectedDocuments').size > 0
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
