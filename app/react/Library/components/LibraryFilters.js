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
    const aggregations = this.props.aggregations.toJS();
    this.props.templates.map((template) => {
      template.results = 0;
      template.total = 0;
      let aggregationsMatch;
      if (aggregations.types) {
        aggregationsMatch = aggregations.types.buckets.find((aggregation) => aggregation.key === template._id);
      }
      if (aggregationsMatch) {
        template.results = aggregationsMatch.filtered.doc_count;
        template.total = aggregationsMatch.doc_count;
      }
    });

    return (
      <SidePanel open={this.props.open}>
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
          <div className="documentTypes-selector">
            <MultiSelect
              value={this.props.documentTypes}
              prefix="documentTypes"
              options={this.props.templates}
              optionsValue="_id"
              optionsLabel="name"
              onChange={this.handleFilterDocType.bind(this)}
            />
          </div>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  templates: PropTypes.array,
  aggregations: PropTypes.object,
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
  props.open = state.library.ui.get('filtersPanel') && !state.library.ui.get('selectedDocument');
  props.templates = state.templates.toJS();
  props.aggregations = state.library.aggregations;
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentTypes, searchDocuments, hideFilters, resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
