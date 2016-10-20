import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';

import {FormField, MultiSelect, DateRange, NestedMultiselect} from 'app/Forms';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {toggleFilter, activateFilter} from 'app/Library/actions/filterActions';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import {store} from 'app/store';
import {t} from 'app/I18N';

export class FiltersForm extends Component {

  onChange(e) {
    if (e.target.type === 'checkbox') {
      this.props.searchDocuments(store.getState().search);
    }
  }

  getFilteredDocumentTypeName() {
    let selectedDocumentTypes = this.props.documentTypes.toJS();
    if (selectedDocumentTypes.length) {
      return this.props.templates.toJS().find((tmpl) => tmpl._id === selectedDocumentTypes[0]).name;
    }
  }

  render() {
    let translationContext = this.getFilteredDocumentTypeName();
    let fields = this.props.fields.toJS();
    fields = libraryHelper.parseWithAggregations(fields, this.props.aggregations.toJS())
    .filter((field) => (field.type !== 'select' && field.type !== 'multiselect') || field.options.length);
    return (
      <div className="filters-box">
        {(() => {
          let documentTypes = this.props.documentTypes.toJS();
          let templates = this.props.templates.toJS();
          let activeTypes = templates.filter((template) => documentTypes.includes(template._id));

          if (documentTypes.length === 0) {
            return <div className="empty-state select-type">
                    <i className="fa fa-arrow-up"></i><b>{t('System', 'Select to start filtering')}</b>
                  </div>;
          }

          if (activeTypes.length > 0 && fields.length === 0) {
            return <div className="empty-state no-filters">
                    <i className="fa fa-close"></i><b>{t('System','No common filters')}</b>
                  </div>;
          }
        })()}
        <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments} onChange={this.onChange.bind(this)}>
        {fields.map((property, index) => {
          let propertyClass = property.active ? 'search__filter is-active' : 'search__filter';
          if (property.type === 'select' || property.type === 'multiselect') {
            return (
              <FormGroup key={index}>
                <FormField model={`search.filters.${property.name}`}>
                  <ul className={propertyClass}>
                    <li>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <MultiSelect
                        prefix={property.name}
                        options={property.options}
                        optionsValue="id" onChange={(options) => this.props.activateFilter(property.name, !!options.length)}
                      />
                    </li>
                  </ul>
                </FormField>
              </FormGroup>
              );
          }
          if (property.type === 'nested') {
            return (
              <FormGroup key={index}>
                  <ul className={propertyClass}>
                    <li>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <div className="nested-strict">
                        <FormField model={`search.filters.${property.name}.strict`}>
                          <input id={property.name + 'strict'} type='checkbox'onChange={() => this.props.activateFilter(property.name, true)}/>
                        </FormField>
                        <label htmlFor={property.name + 'strict'}>
                            <span>&nbsp;Strict mode</span>
                        </label>
                      </div>
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <NestedMultiselect
                        aggregations={this.props.aggregations}
                        property={property}
                        onChange={(options) => {
                          let active = Object.keys(options).reduce((res, prop) => res || options[prop].length || options[prop] === true, false);
                          this.props.activateFilter(property.name, active);
                        }}
                      />
                    </li>
                  </ul>
              </FormGroup>
              );
          }
          if (property.type === 'date' || property.type === 'multidate' || property.type === 'multidaterange') {
            return (
              <FormGroup key={index}>
                <ul className={propertyClass}>
                  <li>
                    {t(translationContext, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                    <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                  </li>
                  <li className="wide">
                    <DateRange
                      fromModel={`search.filters.${property.name}.from`}
                      toModel={`search.filters.${property.name}.to`}
                      fromChange={() => this.props.activateFilter(property.name, true)}
                      toChange={() => this.props.activateFilter(property.name, true)}
                    />
                  </li>
                </ul>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index}>
              <Field model={`search.filters.${property.name}`} >
                <ul className={propertyClass}>
                  <li>
                    <label>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </label>
                  </li>
                  <li className="wide">
                    <input className="form-control" onChange={(e) => this.props.activateFilter(property.name, !!e.target.value)} />
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
  aggregations: PropTypes.object,
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
    aggregations: state.library.aggregations,
    templates: state.templates,
    search: state.search,
    documentTypes: state.library.filters.get('documentTypes')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, toggleFilter, activateFilter}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
