import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';

import Select, {SelectField} from 'app/DocumentForm/components/Select';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';

export class FiltersForm extends Component {

  render() {
    return (
      <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments}>
      {this.props.fields.toJS().map((property, index) => {
        if (property.type === 'select') {
          return (
            <FormGroup key={index}>
              <SelectField model={`search.filters.${property.name}`} >
                <ul className="search__filter">
                  <li>
                    {property.label}
                    {property.required ? <span className="required">*</span> : ''}
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
                </li>
                <li className="wide"><input className="form-control" /></li>
              </ul>
            </Field>
          </FormGroup>
          );
      })}
      </Form>
    );
  }
}

FiltersForm.propTypes = {
  fields: PropTypes.object.isRequired,
  searchDocuments: PropTypes.func,
  search: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    fields: state.library.filters.get('properties'),
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
