import {Field, Form} from 'react-redux-form';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Immutable, {is} from 'immutable';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

import {MultiSelect, DateRange, NestedMultiselect, NumericRange, Switcher} from 'app/ReactReduxForms';
import {activateFilter} from 'app/Library/actions/filterActions';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {t} from 'app/I18N';
import {wrapDispatch} from 'app/Multireducer';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import ShowIf from 'app/App/ShowIf';
import debounce from 'app/utils/debounce';
import libraryHelper from 'app/Library/helpers/libraryFilters';

export class FiltersForm extends Component {

  constructor(props) {
    super(props);
    this.search = debounce((search) => {
      this.props.searchDocuments({search}, this.props.storeKey);
    }, 300);

    this.submit = this.submit.bind(this);
    this.onChange = this.onChange.bind(this);

    this.activateAutoSearch = () => {
      this.autoSearch = true;
    };
  }

  onChange(search) {
    if (this.autoSearch) {
      this.autoSearch = false;
      this.search(search, this.props.storeKey);
    }
  }

  submit(search) {
    this.props.searchDocuments({search}, this.props.storeKey);
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
      !is(this.props.documentTypes, nextProps.documentTypes);
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
            return <div className="blank-state">
              <i className="fa fa-close"></i>
              <h4>{t('System', 'No common filters')}</h4>
              <p>The combination of document and entity types doesn't have any filters in common.</p>
              <a href="#" target="_blank">Learn more</a>
            </div>;
          }
        })()}

        <Form model={model} id="filtersForm" onSubmit={this.submit} onChange={this.onChange}>
          {fields.map((property) => {
            let propertyClass = 'search__filter is-active';
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
                      optionsValue="id"
                      onChange={this.activateAutoSearch}
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
                            onChange={this.activateAutoSearch}
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
                        onChange={this.activateAutoSearch}
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
                        onChange={this.activateAutoSearch}
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
                        onChange={this.activateAutoSearch}
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
                      <input className="form-control" onChange={this.activateAutoSearch} />
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
  templates: PropTypes.instanceOf(Immutable.List),
  aggregations: PropTypes.object,
  fields: PropTypes.object.isRequired,
  searchDocuments: PropTypes.func,
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
    documentTypes: state[props.storeKey].filters.get('documentTypes'),
    dateFormat: state.settings.collection.get('dateFormat')
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({searchDocuments: searchDocuments, activateFilter}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(FiltersForm);
