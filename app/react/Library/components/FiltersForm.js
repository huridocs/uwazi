import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import {createSelector} from 'reselect';
import {is} from 'immutable';

import {MultiSelect, DateRange, NestedMultiselect} from 'app/ReactReduxForms';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {toggleFilter, activateFilter} from 'app/Library/actions/filterActions';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import {t} from 'app/I18N';

import {selectTemplates} from 'app/utils/coreSelectors';

const selectSearch = createSelector(s => s ? s.search : {});

export class FiltersForm extends Component {

  onChange(values) {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.props.searchDocuments(values);
    }
  }

  translatedOptions(property) {
    return property.options.map((option) => {
      option.label = t(property.content, option.label);
      return option;
    });
  }

  shouldComponentUpdate(nextProps) {
    return !is(this.props.fields, nextProps.fields) ||
           !is(this.props.aggregations, nextProps.aggregations) ||
           !is(this.props.documentTypes, nextProps.documentTypes) ||
           this.props.search !== nextProps.search;
  }

  render() {
    const {templates, documentTypes} = this.props;
    const aggregations = this.props.aggregations.toJS();

    let translationContext = documentTypes.get(0);

    const fields = libraryHelper.parseWithAggregations(this.props.fields.toJS(), aggregations)
    .filter((field) => field.type !== 'select' && field.type !== 'multiselect' || field.options.length);

    return (
      <div className="filters-box">
        {(() => {
          let activeTypes = templates.filter((template) => documentTypes.includes(template._id));

          if (documentTypes.length === 0) {
            return <div className="empty-state select-type">
                    <i className="fa fa-arrow-up"></i><b>{t('System', 'Select to start filtering')}</b>
                  </div>;
          }

          if (activeTypes.length > 0 && fields.length === 0) {
            return <div className="empty-state no-filters">
                    <i className="fa fa-close"></i><b>{t('System', 'No common filters')}</b>
                  </div>;
          }
        })()}
        <Form model="search" id="filtersForm" onSubmit={this.props.searchDocuments} onChange={this.onChange.bind(this)}>
        {fields.map((property, index) => {
          let propertyClass = property.active ? 'search__filter is-active' : 'search__filter';
          if (property.type === 'select' || property.type === 'multiselect') {
            return (
              <FormGroup key={index}>
                  <ul className={propertyClass}>
                    <li>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <figure className="switcher" onClick={() => this.props.toggleFilter(property.name)}></figure>
                    </li>
                    <li className="wide">
                      <MultiSelect
                        model={`.filters.${property.name}`}
                        prefix={property.name}
                        options={this.translatedOptions(property)}
                        optionsValue="id" onChange={(options) => {
                          this.autoSearch = true;
                          this.props.activateFilter(property.name, !!options.length);
                        }}
                      />
                    </li>
                  </ul>
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
                        <Field model={`.filters.${property.name}.strict`}>
                          <input id={property.name + 'strict'} type='checkbox'onChange={() => this.props.activateFilter(property.name, true)}/>
                        </Field>
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
                          this.autoSearch = true;
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
                      model={`.filters.${property.name}`}
                      fromChange={() => {
                        this.autoSearch = true;
                        this.props.activateFilter(property.name, true);
                      }}
                      toChange={() => {
                        this.autoSearch = true;
                        this.props.activateFilter(property.name, true);
                      }}
                    />
                  </li>
                </ul>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={index}>
              <Field model={`.filters.${property.name}`} >
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
  templates: PropTypes.array,
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
    templates: selectTemplates(state),
    search: selectSearch(state),
    documentTypes: state.library.filters.get('documentTypes')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, toggleFilter, activateFilter}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
