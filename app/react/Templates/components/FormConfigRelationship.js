import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import PropertyConfigOptions from './PropertyConfigOptions';
import PropertyConfigOption from './PropertyConfigOption';
import Tip from '../../Layout/Tip';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type, templates, relationTypes } = this.props;
    const property = data.properties[index];

    const options = templates.toJS().filter(template => template._id !== data._id);
    const labelError =
      formState.$form.errors[`properties.${index}.label.required`] ||
      formState.$form.errors[`properties.${index}.label.duplicated`];
    const relationTypeError =
      formState.$form.errors[`properties.${index}.relationType.required`] &&
      formState.$form.submitFailed;
    const inheritPropertyError =
      formState.$form.errors[`properties.${index}.inheritProperty.required`] &&
      formState.$form.submitFailed;
    const labelClass = labelError ? 'form-group has-error' : 'form-group';
    const template = templates
      .toJS()
      .find(
        t =>
          formState.properties[index].content && t._id === formState.properties[index].content.value
      );
    const templateProperties = template ? template.properties : [];

    return (
      <div>
        <div className={labelClass}>
          <label htmlFor="label">
            <Translate>Label</Translate>
          </label>
          <Field model={`template.data.properties[${index}].label`}>
            <input id="label" className="form-control" />
          </Field>
        </div>
        <div className={relationTypeError ? 'form-group has-error' : 'form-group'}>
          <label>
            <Translate>Relationship</Translate>
            <span className="required">*</span>
          </label>
          <Select
            model={`template.data.properties[${index}].relationType`}
            options={relationTypes.toJS()}
            optionsLabel="name"
            validators={FormConfigRelationship.contentValidation()}
            optionsValue="_id"
          />
        </div>
        <div className="form-group">
          <label>
            <Translate>Entities</Translate>
          </label>
          <Select
            model={`template.data.properties[${index}].content`}
            options={options}
            optionsLabel="name"
            placeholder="Any entity or document"
            optionsValue="_id"
          />
        </div>
        {Boolean(formState.properties[index].content && templateProperties.length) && (
          <PropertyConfigOption
            label="Inherit property"
            model={`template.data.properties[${index}].inherit`}
          >
            <Tip>
              This property will be inherited from the related entities and shown as metadata of
              this type of entities.
            </Tip>
          </PropertyConfigOption>
        )}
        {Boolean(
          formState.properties[index].inherit &&
            formState.properties[index].inherit.value &&
            templateProperties.length
        ) && (
          <div className={inheritPropertyError ? 'form-group has-error' : 'form-group'}>
            <Select
              model={`template.data.properties[${index}].inheritProperty`}
              options={templateProperties}
              optionsLabel="label"
              optionsValue="_id"
            />
          </div>
        )}
        <PropertyConfigOptions index={index} property={property} type={type} />
      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  formState: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    templates: state.templates,
    relationTypes: state.relationTypes,
    formState: state.template.formState,
  };
}

export default connect(mapStateToProps)(FormConfigRelationship);
