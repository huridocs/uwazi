import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {filterDocumentTypes, resetFilters} from 'app/Library/actions/filterActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import SidePanel from 'app/Layout/SidePanel';
import {t} from 'app/I18N';

export class LibraryFilters extends Component {

  constructor(props) {
    super(props);
  }

  handleFilterDocType(documentTypes) {
    this.props.filterDocumentTypes(documentTypes);
  }

  render() {
    return (
      <SidePanel open={this.props.open}>
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
          <div className="documentTypes-selector">
            <DocumentTypesList onChange={this.handleFilterDocType.bind(this)}/>
          </div>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  filterDocumentTypes: PropTypes.func,
  resetFilters: PropTypes.func,
  open: PropTypes.bool
};

export function mapStateToProps({library}) {
  return {
    open: library.ui.get('filtersPanel') && !library.ui.get('selectedDocument')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentTypes, resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
