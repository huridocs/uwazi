import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {resetFilters} from 'app/Library/actions/filterActions';
import FiltersForm from 'app/Library/components/FiltersForm';
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
          <div className="documentTypes-selector">
            <DocumentTypesList />
          </div>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func,
  open: PropTypes.bool
};

export function mapStateToProps({library}) {
  return {
    open: library.ui.get('filtersPanel') && !library.ui.get('selectedDocument')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
