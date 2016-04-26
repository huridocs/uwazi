import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {getValues} from 'redux-form';

import {filterDocumentType, filterAllDocumentTypes} from 'app/Library/actions/filterActions';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import FiltersForm from 'app/Library/components/FiltersForm';

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
      <aside className="col-xs-12 col-sm-3">
        <div className="search">
          <div className="search__button--apply__filters">
            <a onClick={this.applyFilters.bind(this)} className="btn btn-success btn-block apply-filters"><i className="fa fa-chevron-left"></i>Apply filters</a>
          </div>
          <ul className="search__filter search__filter--radiobutton">
            <li>Document type</li>
            <li>
              <input
                onChange={this.props.filterAllDocumentTypes}
                id="all-documents"
                type="checkbox"
                defaultChecked={true}
                checked={this.props.allDocumentTypes}/>
              <label htmlFor="all-documents">Select all</label>
            </li>
            {this.props.templates.map((template, index) => {
              return <li key={index}>
                      <input onChange={this.handleFilterDocType.bind(this)}
                            defaultChecked={true}
                            id={template._id}
                            type="checkbox"
                            checked={this.props.documentTypes[template._id]}/>
                      <label htmlFor={template._id}>{template.name}</label>
                    </li>;
            })}
          </ul>
          <FiltersForm />
        </div>
      </aside>
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
