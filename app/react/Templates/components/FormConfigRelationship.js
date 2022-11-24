import { Field, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { Select } from 'app/ReactReduxForms';
import { Translate, t } from 'app/I18N';
import { Icon } from 'app/UI';
import PropertyConfigOptions from './PropertyConfigOptions';
import Tip from '../../Layout/Tip';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  constructor(props) {
    super(props);
    this.state = { inherit: props.showInheritSelect };
    this.onInheritChange = this.onInheritChange.bind(this);
    this.onInheritTypeChange = this.onInheritTypeChange.bind(this);
  }

  onInheritChange() {
    const { index } = this.props;
    if (this.state.inherit) {
      this.props.resetFormValue(`template.data.properties[${index}].inherit.property`);
    }
    this.props.resetFormValue(`template.data.properties[${index}].filter`);
    this.setState(prevState => ({ inherit: !prevState.inherit }));
  }

  onInheritTypeChange() {
    const { index } = this.props;
    this.props.resetFormValue(`template.data.properties[${index}].filter`);
  }

  render() {
    const {
      index,
      type,
      labelError,
      relationTypeError,
      templates,
      relationTypes,
      templateId,
      showInheritOption,
      templateProperties,
      inheritSelectPropertyType,
    } = this.props;

    const options = templates.toJS().filter(template => template._id !== templateId);

    const labelClass = labelError ? 'form-group has-error' : 'form-group';
    const canBeFilter =
      !this.state.inherit ||
      (this.state.inherit &&
        !['image', 'geolocation', 'preview', 'media', 'link'].includes(inheritSelectPropertyType));
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
            placeholder={t('System', 'Any entity or document', null, false)}
            optionsValue="_id"
          />
        </div>
        {showInheritOption && (
          <div>
            <label className="property-label" htmlFor={`inherit${index}`}>
              <input
                id={`inherit${index}`}
                type="checkbox"
                checked={this.state.inherit}
                onChange={this.onInheritChange}
              />{' '}
              <Translate>Inherit property</Translate>
            </label>
            <Tip>
              <Translate>
                This property will be inherited from the related entities and shown as metadata of
                this type of entities.
              </Translate>
            </Tip>
          </div>
        )}
        {this.state.inherit && (
          <div className="form-group">
            <Select
              model={`template.data.properties[${index}].inherit.property`}
              options={templateProperties}
              onChange={this.onInheritTypeChange}
              optionsLabel="label"
              optionsValue="_id"
            />
          </div>
        )}
        {this.state.inherit && inheritSelectPropertyType === 'geolocation' && (
          <div className="geolocation-grouping-alert">
            <Icon icon="info-circle" />
            <p>
              <Translate>Adjacent geolocation properties will render on the same map</Translate>.
            </p>
          </div>
        )}
        <PropertyConfigOptions canBeFilter={canBeFilter} index={index} type={type} />
      </div>
    );
  }
}

FormConfigRelationship.defaultProps = {
  labelError: false,
  relationTypeError: false,
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
  showInheritOption: PropTypes.bool,
  showInheritSelect: PropTypes.bool,
  templateId: PropTypes.string,
  inheritSelectPropertyType: PropTypes.string,
  resetFormValue: PropTypes.func.isRequired,
};

const getTemplateProperties = createSelector(
  state => state.templates,
  (state, props) =>
    state.template.formState.properties[props.index].content
      ? state.template.formState.properties[props.index].content.value
      : null,
  (templates, content) => {
    const targetTemplate = templates.find(template => template.get('_id') === content);
    return targetTemplate ? targetTemplate.get('properties').toJS() : [];
  }
);

const getInheritSelectPropertyType = createSelector(
  getTemplateProperties,
  (state, props) => state.template.data.properties[props.index].inherit?.property,
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

    showInheritOption: Boolean(
      template.formState.properties[props.index].content && templateProperties.length
    ),

    showInheritSelect: Boolean(
      template.formState.properties[props.index].inherit?.property?.value &&
        templateProperties.length
    ),
    inheritSelectPropertyType: getInheritSelectPropertyType(state, props),
    templateProperties,
    templateId: template.data._id,
    templates,
    relationTypes,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resetFormValue: model => formActions.reset(model),
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(FormConfigRelationship);
