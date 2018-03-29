import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState } = this.props;
    const thesauris = this.props.thesauris.toJS();
    const property = data.properties[index];
    const relationTypes = this.props.relationTypes.toJS();

    const options = thesauris.filter(thesauri => thesauri._id !== data._id && thesauri.type === 'template');

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const relationTypeError = formState.$form.errors[`properties.${index}.relationType.required`] && formState.$form.submitFailed;
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className={labelClass}>
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control"/>
          </Field>
        </div>

        <div className="form-group">
          <label>{t('System', 'Select list')}</label>
          <Select
            model={`template.data.properties[${index}].content`}
            options={options}
            optionsLabel="name"
            placeholder="Any entity or document"
            optionsValue="_id"
          />
        </div>

        <div className={relationTypeError ? 'form-group has-error' : 'form-group'}>
          <label>{t('System', 'Relationship')}<span className="required">*</span></label>
          <Select
            model={`template.data.properties[${index}].relationType`}
            options={relationTypes}
            optionsLabel="name"
            validators={FormConfigRelationship.contentValidation()}
            optionsValue="_id"
          />
        </div>

        <Field model={`template.data.properties[${index}].required`}>
          <input id={`required${this.props.index}`} type="checkbox"/>
          &nbsp;
          <label className="property-label" htmlFor={`required${this.props.index}`}>
            Required property
            <i className="property-help fa fa-question-circle">
              <div className="property-description">You won't be able to publish a document if this property is empty.</div>
            </i>
          </label>
        </Field>

        <Field model={`template.data.properties[${index}].showInCard`}>
          <input id={`showInCard${this.props.index}`} type="checkbox"/>
          &nbsp;
          <label className="property-label" htmlFor={`showInCard${this.props.index}`}>
            Show in cards
            <i className="property-help fa fa-question-circle">
              <div className="property-description">This property will appear in the library cards as part of the basic info.</div>
            </i>
          </label>
        </Field>

        <div>
          <Field model={`template.data.properties[${index}].filter`}>
            <input id={`filter${this.props.index}`} type="checkbox"/>
            &nbsp;
            <label className="property-label" htmlFor={`filter${this.props.index}`}>
              Use as filter
              <i className="property-help fa fa-question-circle">
                <div className="property-description">
                  This property will be used for filtering the library results.
                  When properties match in equal name and field type with other document types, they will be combined for filtering.
                </div>
              </i>
            </label>
          </Field>
          {property.filter && (
            <Field className="filter" model={`template.data.properties[${index}].defaultfilter`}>
              <input
                id={`defaultfilter${this.props.index}`}
                type="checkbox"
                disabled={!property.filter}
              />
              &nbsp;
              <label className="property-label" htmlFor={`defaultfilter${this.props.index}`}>
                Default filter
                <i className="property-help fa fa-question-circle">
                  <div className="property-description">
                    Use this property as a default filter in the library.
                    When there are no document types selected, this property will show as a default filter for your collection.
                  </div>
                </i>
              </label>
            </Field>
          )
          }
          <FilterSuggestions {...property} />
        </div>
      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  thesauris: PropTypes.object,
  relationTypes: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    relationTypes: state.relationTypes,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigRelationship);
