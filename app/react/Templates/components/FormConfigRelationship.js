import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { Select } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import PropertyConfigOptions from './PropertyConfigOptions';
import PropertyConfigOption from './PropertyConfigOption';
import Tip from '../../Layout/Tip';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const {
      index,
      type,
      inheritPropertyError,
      labelError,
      relationTypeError,
      templates,
      relationTypes,
      templateId,
      showInheritOption,
      showInheritSelect,
      templateProperties,
      inheritSelectPropertyType,
    } = this.props;

    const options = templates.toJS().filter(template => template._id !== templateId);

    const labelClass = labelError ? 'form-group has-error' : 'form-group';

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
        {showInheritOption && (
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
        {showInheritSelect && (
          <div className={inheritPropertyError ? 'form-group has-error' : 'form-group'}>
            <Select
              model={`template.data.properties[${index}].inheritProperty`}
              options={templateProperties}
              optionsLabel="label"
              optionsValue="_id"
            />
          </div>
        )}
        {showInheritSelect && inheritSelectPropertyType === 'geolocation' && (
          <div className="geolocation-grouping-alert">
            <Icon icon="info-circle" />
            <p>
              <Translate>
                Grouping geolocation properties together will show them on the same map
              </Translate>
              .
            </p>
          </div>
        )}
        <PropertyConfigOptions index={index} type={type} />
      </div>
    );
  }
}

FormConfigRelationship.defaultProps = {
  labelError: false,
  relationTypeError: false,
  inheritPropertyError: false,
  showInheritOption: false,
  showInheritSelect: false,
  templateId: null,
  inheritSelectPropertyType: null,
};

FormConfigRelationship.propTypes = {
  templates: PropTypes.instanceOf(Immutable.List).isRequired,
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  templateProperties: PropTypes.array.isRequired,
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  labelError: PropTypes.bool,
  relationTypeError: PropTypes.bool,
  inheritPropertyError: PropTypes.bool,
  showInheritOption: PropTypes.bool,
  showInheritSelect: PropTypes.bool,
  templateId: PropTypes.string,
  inheritSelectPropertyType: PropTypes.string,
};

const getTemplateProperties = createSelector(
  state => state.templates,
  (state, props) =>
    state.template.formState.properties[props.index].content
      ? state.template.formState.properties[props.index].content.value
      : null,
  (templates, content) => {
    const targetTemplate = templates.find(t => t.get('_id') === content);
    return targetTemplate ? targetTemplate.get('properties').toJS() : [];
  }
);

const getInheritSelectPropertyType = createSelector(
  getTemplateProperties,
  (state, props) => state.template.data.properties[props.index].inheritProperty,
  (templateProperties, inheritedPropertyId) => {
    const inheritedProperty = templateProperties.find(p => p._id === inheritedPropertyId);
    return inheritedProperty && inheritedProperty.type;
  }
);

export function mapStateToProps(state, props) {
  const { template, templates, relationTypes } = state;

  const templateProperties = getTemplateProperties(state, props);

  return {
    labelError:
      template.formState.$form.errors[`properties.${props.index}.label.required`] ||
      template.formState.$form.errors[`properties.${props.index}.label.duplicated`],

    relationTypeError:
      template.formState.$form.errors[`properties.${props.index}.relationType.required`] &&
      template.formState.$form.submitFailed,

    inheritPropertyError:
      template.formState.$form.errors[`properties.${props.index}.inheritProperty.required`] &&
      template.formState.$form.submitFailed,

    showInheritOption: Boolean(
      template.formState.properties[props.index].content && templateProperties.length
    ),

    showInheritSelect: Boolean(
      template.formState.properties[props.index].inherit &&
        template.formState.properties[props.index].inherit.value &&
        templateProperties.length
    ),
    inheritSelectPropertyType: getInheritSelectPropertyType(state, props),
    templateProperties,
    templateId: template.data._id,
    templates,
    relationTypes,
  };
}

export default connect(mapStateToProps)(FormConfigRelationship);
