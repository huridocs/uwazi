import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type } = this.props;
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
        <PropertyConfigOptions index={index} property={property} type={type} />
      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  formState: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
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
