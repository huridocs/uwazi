import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {filterDocumentTypes, resetFilters} from 'app/Library/actions/filterActions';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {hideFilters} from 'app/Library/actions/libraryActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import SidePanel from 'app/Layout/SidePanel';
import {MultiSelect} from 'app/Forms';

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
        <div className="sidepanel-header">
          <h1>
            <span>Filters</span>
            <small>
              <span onClick={this.props.resetFilters}>
                <i className="fa fa-refresh"></i>
                <span>Reset filters</span>
              </span>
            </small>
          </h1>
       </div>
        <div className="sidepanel-footer">
          <span onClick={this.props.resetFilters} className="btn btn-primary">
            <i className="fa fa-refresh"></i>
            <span className="btn-label">Reset</span>
          </span>
          <button type="submit" form="filtersForm" className="btn btn-success">
            <i className="fa fa-search"></i>
            <span className="btn-label">Search</span>
          </button>
        </div>
        <div className="sidepanel-body">
          <div>Document Types</div>
          <MultiSelect
            value={this.props.documentTypes}
            prefix="documentTypes"
            options={this.props.templates}
            optionsValue="_id"
            optionsLabel="name"
            onChange={this.handleFilterDocType.bind(this)}
          />
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  templates: PropTypes.array,
  thesauris: PropTypes.array,
  filterDocumentTypes: PropTypes.func,
  resetFilters: PropTypes.func,
  hideFilters: PropTypes.func,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string,
  open: PropTypes.bool,
  documentTypes: PropTypes.array
};

export function mapStateToProps(state) {
  let props = state.library.filters.toJS();
  props.searchTerm = state.library.ui.toJS().searchTerm;
  props.documentTypes = props.documentTypes;
  props.open = state.library.ui.get('filtersPanel') && !state.library.ui.get('selectedDocument');
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentTypes, searchDocuments, hideFilters, resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
