import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';

import Select, {SelectField} from 'app/DocumentForm/components/Select';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {toggleFilter, activateFilter} from 'app/Library/actions/filterActions';

export class FiltersForm extends Component {

  render() {
    let fields = this.props.fields.toJS();
    return (
      <div className="filters-box">
        {(() => {
          let documentTypes = this.props.documentTypes.toJS();
          let templates = this.props.templates.toJS();
          let types = Object.keys(documentTypes);
          let filtering = types.reduce((result, key) => {
            return result || documentTypes[key];
          }, false);

          let formatedTypes = templates.reduce((result, template) => {
            if (documentTypes[template._id]) {
              result.push(template.name);
            }
            return result;
          }, []).join(', ').replace(/(,) (\w* *\w*$)/, ' and $2');

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

          if (filtering && fields.length > 0) {
            return <div className="title">
                    <i className="fa fa-tag"></i>Common filters for<b> {formatedTypes}</b>
                  </div>;
          }
        })()}
        <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments}>
        {fields.map((property, index) => {
          let propertyClass = property.active ? 'search__filter is-active' : 'search__filter';
          if (property.type === 'select') {
            return (
              <FormGroup key={index}>
                <SelectField model={`search.filters.${property.name}`} >
                  <ul className={propertyClass}>
                    <li>
                      {property.label}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <Select options={property.options} onChange={() => this.props.activateFilter(property.name)} />
                    </li>
                  </ul>
                </SelectField>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index}>
              <Field model={`search.filters.${property.name}`} >
                <ul className={propertyClass}>
                  <li>
                    {property.label}
                    {property.required ? <span className="required">*</span> : ''}
                    <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                  </li>
                  <li className="wide">
                    <input className="form-control" onChange={() => this.props.activateFilter(property.name)} />
                  </li>
                </ul>
              </Field>
            </FormGroup>
            );
        })}
        </Form>
      </div>
    );
  }
}

FiltersForm.propTypes = {
  templates: PropTypes.object,
  fields: PropTypes.object.isRequired,
  searchDocuments: PropTypes.func,
  toggleFilter: PropTypes.func,
  activateFilter: PropTypes.func,
  search: PropTypes.object,
  documentTypes: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    fields: state.library.filters.get('properties'),
    templates: state.library.filters.get('templates'),
    search: state.search,
    documentTypes: state.library.filters.get('documentTypes')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, toggleFilter, activateFilter}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
