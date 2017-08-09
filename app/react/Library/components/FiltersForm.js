import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';
import {Field, Form} from 'react-redux-form';
import {is} from 'immutable';

import {MultiSelect, DateRange, NestedMultiselect, NumericRange, Switcher} from 'app/ReactReduxForms';
import ShowIf from 'app/App/ShowIf';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {toggleFilter, activateFilter} from 'app/Library/actions/filterActions';
import libraryHelper from 'app/Library/helpers/libraryFilters';
import {t} from 'app/I18N';
import debounce from 'app/utils/debounce';

export class FiltersForm extends Component {

  constructor(props) {
    super(props);
    this.search = debounce((values) => {
      this.props.searchDocuments(values, this.props.storeKey);
    }, 400);
  }

  onChange(values) {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.search(values, this.props.storeKey);
    }
  }

  submit(values) {
    this.props.searchDocuments(values, this.props.storeKey);
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
    const allFields = this.props.fields.toJS();
    const fields = libraryHelper.parseWithAggregations(allFields.slice(0), aggregations)
    .filter((field) => field.type !== 'select' && field.type !== 'multiselect' || field.options.length);
    const model = this.props.storeKey + '.search';
    return (
      <div className="filters-box">
        {(() => {
          let activeTypes = templates.filter((template) => documentTypes.includes(template.get('_id')));
          if (activeTypes.size > 0 && fields.length === 0) {
            return <div className="empty-state no-filters">
                    <i className="fa fa-close"></i>
                    <span>{t('System', 'No common filters')}</span>
                  </div>;
          }
        })()}

        <Form model={model} id="filtersForm" onSubmit={this.submit.bind(this)} onChange={this.onChange.bind(this)}>
        {fields.map((property) => {
          let propertyClass = property.active ? 'search__filter is-active' : 'search__filter';
          if (property.type === 'select' || property.type === 'multiselect') {
            return (
              <FormGroup key={property.name}>
                  <ul className={propertyClass}>
                    <li>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <ShowIf if={property.type === 'multiselect'}>
                        <Switcher model={`.filters.${property.name}.and`} prefix={property.name} onChange={() => {
                          this.autoSearch = true;
                        }}/>
                      </ShowIf>
                    </li>
                    <li className="wide">
                      <MultiSelect
                        model={`.filters.${property.name}.values`}
                        prefix={property.name}
                        options={this.translatedOptions(property)}
                        optionsValue="id" onChange={(options) => {
                          this.autoSearch = true;
                          this.props.activateFilter(property.name, !!options.length, allFields);
                        }}
                      />
                    </li>
                  </ul>
              </FormGroup>
              );
          }
          if (property.type === 'nested') {
            return (
              <FormGroup key={property.name}>
                  <ul className={propertyClass}>
                    <li>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                      <div className="nested-strict">
                        <Field model={`.filters.${property.name}.strict`}>
                          <input
                            id={property.name + 'strict'}
                            type='checkbox'
                            onChange={() => {
                              this.autoSearch = true;
                              this.props.activateFilter(property.name, true, allFields);
                            }
                          }
                          />
                        </Field>
                        <label htmlFor={property.name + 'strict'}>
                            <span>&nbsp;Strict mode</span>
                        </label>
                      </div>
                    </li>
                    <li className="wide">
                      <NestedMultiselect
                        aggregations={this.props.aggregations}
                        property={property}
                        onChange={(options) => {
                          this.autoSearch = true;
                          let active = Object.keys(options).reduce((res, prop) => res || options[prop].length || options[prop] === true, false);
                          this.props.activateFilter(property.name, active, allFields);
                        }}
                      />
                    </li>
                  </ul>
              </FormGroup>
            );
          }
          if (property.type === 'date' || property.type === 'multidate' || property.type === 'multidaterange' || property.type === 'daterange') {
            return (
              <FormGroup key={property.name}>
                <ul className={propertyClass}>
                  <li>
                    {t(translationContext, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                  </li>
                  <li className="wide">
                    <DateRange
                      model={`.filters.${property.name}`}
                      onChange={(val) => {
                        this.autoSearch = true;
                        this.props.activateFilter(property.name, Boolean(val.from || val.to), allFields);
                      }}
                      format={this.props.dateFormat}
                    />
                  </li>
                </ul>
              </FormGroup>
              );
          }
          if (property.type === 'numeric') {
            return (
              <FormGroup key={property.name}>
                <ul className={propertyClass}>
                  <li>
                    {t(translationContext, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                  </li>
                  <li className="wide">
                    <NumericRange
                      model={`.filters.${property.name}`}
                      onChange={(val) => {
                        this.props.activateFilter(property.name, Boolean(val.from || val.to), allFields);
                      }}
                    />
                  </li>
                </ul>
              </FormGroup>
              );
          }
          return (
            <FormGroup key={property.name}>
              <Field model={`.filters.${property.name}`} >
                <ul className={propertyClass}>
                  <li>
                    <label>
                      {t(translationContext, property.label)}
                      {property.required ? <span className="required">*</span> : ''}
                    </label>
                  </li>
                  <li className="wide">
                    <input className="form-control" onChange={(e) => {
                      this.autoSearch = true;
                      this.props.activateFilter(property.name, !!e.target.value, allFields);
                    }} />
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
  documentTypes: PropTypes.object,
  storeKey: PropTypes.string,
  dateFormat: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    fields: state[props.storeKey].filters.get('properties'),
    aggregations: state[props.storeKey].aggregations,
    templates: state.templates,
    search: state[props.storeKey].search,
    documentTypes: state[props.storeKey].filters.get('documentTypes'),
    dateFormat: state.settings.collection.get('dateFormat')
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({searchDocuments: searchDocuments, toggleFilter, activateFilter}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
