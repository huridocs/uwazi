import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';

import Select, {SelectField} from 'app/DocumentForm/components/Select';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';

export class FiltersForm extends Component {

  render() {
    let fields = this.props.fields.toJS();
    return (
      <div className="filters-box">
        <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments}>
        {fields.map((property, index) => {
          if (property.type === 'select') {
            return (
              <FormGroup key={index}>
                <SelectField model={`search.filters.${property.name}`} >
                  <ul className="search__filter">
                    <li>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher switcher-active"></figure>
                    </li>
                    <li className="wide">
                      <Select options={property.options} />
                    </li>
                  </ul>
                </SelectField>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index}>
              <Field model={`search.filters.${property.name}`} >
                <ul className="search__filter">
                  <li>
                    {property.label}
                    {property.required ? <span className="required">*</span> : ''}
                    <figure className="switcher switcher-active"></figure>
                  </li>
                  <li className="wide"><input className="form-control" /></li>
                </ul>
              </Field>
            </FormGroup>
            );
        })}
        </Form>
        {(() => {
          let documentTypes = this.props.documentTypes.toJS();
          let filtering = Object.keys(documentTypes).reduce((result, key) => {
            return result || documentTypes[key];
          }, false);

          if (!filtering) {
            return <div className="empty-state select-type">
                    <i className="fa fa-arrow-up"></i><b>Filter the results</b>
                    <p>Select at least one type of document to start filtering the results.</p>
                  </div>;
          }

          if (filtering && fields.length === 0) {
            return <div className="empty-state no-filters">
                    <i className="fa fa-close"></i><b>No common filters</b>
                    <p>The combination of document types has no filters in common.</p>
                  </div>;
          }
        })()}
      </div>
    );
  }
}

FiltersForm.propTypes = {
  fields: PropTypes.object.isRequired,
  searchDocuments: PropTypes.func,
  search: PropTypes.object,
  documentTypes: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    fields: state.library.filters.get('properties'),
    search: state.search,
    documentTypes: state.library.filters.get('documentTypes')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
