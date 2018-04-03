import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

import PropertyConfigOption from './PropertyConfigOption';
import Tip from '../../Layout/Tip';

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

        <PropertyConfigOption label="Required property" model={`template.data.properties[${index}].required`}>
          <Tip>You won't be able to publish a document if this property is empty.</Tip>
        </PropertyConfigOption>

        <PropertyConfigOption label="Show in cards" model={`template.data.properties[${index}].showInCard`}>
          <Tip>This property will appear in the library cards as part of the basic info.</Tip>
        </PropertyConfigOption>

        <div>
          <PropertyConfigOption label="Use as filter" model={`template.data.properties[${index}].filter`}>
            <Tip>
              This property will be used for filtering the library results.
              When properties match in equal name and field type with other document types, they will be combined for filtering.
            </Tip>
          </PropertyConfigOption>
          {property.filter && (
            <PropertyConfigOption label="Default filter" model={`template.data.properties[${index}].defaultfilter`}>
              <Tip>
                Use this property as a default filter in the library.
                When there are no document types selected, this property will show as a default filter for your collection.
              </Tip>
            </PropertyConfigOption>
          )
          }
          <FilterSuggestions {...property} />
        </div>
      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  formState: PropTypes.object.isRequired
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
