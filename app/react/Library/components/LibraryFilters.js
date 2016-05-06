import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {getValues} from 'redux-form';

import {filterDocumentType, filterAllDocumentTypes} from 'app/Library/actions/filterActions';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import SidePanel from 'app/Layout/SidePanel';

export class LibraryFilters extends Component {

  componentWillMount() {
    this.docTypes = [];
  }

  handleFilterDocType(e) {
    this.props.filterDocumentType(e.target.id);
  }

  applyFilters() {
    this.props.searchDocuments(this.props.searchTerm, getValues(this.props.form));
  }

  render() {
    return (
      <SidePanel open={true}>
        <div className="search">
          <h1>Filters<small> <i className="fa fa-refresh"></i><span>Reset filters</span></small></h1>
          <i className="fa fa-close close-modal"></i>
          <ul className="search__filter search__filter--type">
            <li>Filter by document type:</li>
            <li>
              <input
                onChange={this.props.filterAllDocumentTypes}
                id="all-documents"
                type="checkbox"
                checked={this.props.allDocumentTypes}/>
              <label htmlFor="all-documents">&nbsp;Select all</label>
            </li>
            {this.props.templates.map((template, index) => {
              return <li key={index}>
                <input onChange={this.handleFilterDocType.bind(this)}
                  id={template._id}
                  type="checkbox"
                  checked={this.props.documentTypes[template._id]}/>
                <label htmlFor={template._id}>&nbsp;{template.name}</label>
              </li>;
            })}
          </ul>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  templates: PropTypes.array,
  allDocumentTypes: PropTypes.bool,
  documentTypes: PropTypes.object,
  form: PropTypes.object,
  filterDocumentType: PropTypes.func,
  filterAllDocumentTypes: PropTypes.func,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string
};

export function mapStateToProps(state) {
  let props = state.library.filters.toJS();
  props.form = state.form.filters;
  props.searchTerm = state.library.ui.toJS().searchTerm;
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentType, filterAllDocumentTypes, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
