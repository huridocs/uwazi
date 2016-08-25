import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {filterDocumentType, filterAllDocumentTypes, resetFilters} from 'app/Library/actions/filterActions';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {hideFilters} from 'app/Library/actions/libraryActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import SidePanel from 'app/Layout/SidePanel';

export class LibraryFilters extends Component {

  componentWillMount() {
    this.docTypes = [];
  }

  handleFilterDocType(e) {
    this.props.filterDocumentType(e.target.id);
  }

  handleFilterAllDocuments() {
    this.props.filterAllDocumentTypes(!this.props.allDocumentTypes);
  }

  render() {
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
          <ul className="multiselect is-active">
            <li className="multiselectLabel">
                <input className="form-control" placeholder="Document type" />
                <i className="fa fa-search"></i>
            </li>
            <li className="multiselectItem multiselectItem--all">
              <input
                className="multiselectItem-input"
                onClick={this.handleFilterAllDocuments.bind(this)}
                id="all-documents"
                type="checkbox"
                checked={this.props.allDocumentTypes}/>
              <label
                className="multiselectItem-label"
                htmlFor="all-documents">
                  <i className="multiselectItem-icon fa fa-square"></i>
                  <i className="multiselectItem-icon fa fa-check-square"></i>
                  <span>Select all</span>
              </label>
            </li>
            {this.props.templates.map((template, index) => {
              return <li className="multiselectItem" key={index}>
                <input
                  className="multiselectItem-input"
                  onChange={this.handleFilterDocType.bind(this)}
                  id={template._id}
                  type="checkbox"
                  checked={this.props.documentTypes[template._id]}/>
                <label
                  className="multiselectItem-label"
                  htmlFor={template._id}>
                    <i className="multiselectItem-icon fa fa-square"></i>
                    <i className="multiselectItem-icon fa fa-check-square"></i>
                    <span>{template.name}</span>
                </label>
              </li>;
            })}

            <li className="multiselectItem" key='999'>
              <input
                className="multiselectItem-input"
                type="checkbox" />
              <label
                className="multiselectItem-label">
                  <i className="multiselectItem-icon fa fa-square"></i>
                  <i className="multiselectItem-icon fa fa-check-square"></i>
                  <span>Test</span>
              </label>
            </li>

            <li className="multiselectButton">
                <button className="btn btn-xs btn-default">
                  <i className="fa fa-caret-down"></i>
                  <span>Show 73 more</span>
                </button>
                <button className="btn btn-xs btn-default">
                  <i className="fa fa-caret-up"></i>
                  <span>Show less</span>
                </button>
            </li>
          </ul>
          <FiltersForm />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.propTypes = {
  templates: PropTypes.array,
  thesauris: PropTypes.array,
  allDocumentTypes: PropTypes.bool,
  documentTypes: PropTypes.object,
  filterDocumentType: PropTypes.func,
  filterAllDocumentTypes: PropTypes.func,
  resetFilters: PropTypes.func,
  hideFilters: PropTypes.func,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string,
  open: PropTypes.bool
};

export function mapStateToProps(state) {
  let props = state.library.filters.toJS();
  props.searchTerm = state.library.ui.toJS().searchTerm;
  props.open = state.library.ui.get('filtersPanel') && !state.library.ui.get('selectedDocument');
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentType, filterAllDocumentTypes, searchDocuments, hideFilters, resetFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
