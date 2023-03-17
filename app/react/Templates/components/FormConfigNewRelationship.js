/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-pascal-case */
import { Field, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { Select } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { Control } from 'react-redux-form';
import PropertyConfigOptions from './PropertyConfigOptions';
import { RelationshipsQueryBuilder } from './RelationshipsQueryBuilder/RelationshipsQueryBuilder';

class FormConfigNewRelationshipComponent extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  constructor(props) {
    super(props);
    this.state = { inherit: props.showInheritSelect };
    this.onInheritTypeChange = this.onInheritTypeChange.bind(this);
  }

  onInheritTypeChange() {
    const { index } = this.props;
    this.props.resetFormValue(`template.data.properties[${index}].filter`);
  }

  render() {
    const { index, type, labelError, templateProperties, inheritSelectPropertyType } = this.props;

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
        <div className="form-group">
          <label>
            <Translate>Query</Translate>
          </label>
          <Control
            component={RelationshipsQueryBuilder}
            model={`template.data.properties[${index}].query`}
          />
        </div>
        <div className="form-group">
          <label>
            <Translate>Denormalized property</Translate>
          </label>
          <Select
            model={`template.data.properties[${index}].denormalizedProperty`}
            options={templateProperties}
            onChange={this.onInheritTypeChange}
            optionsLabel="label"
            optionsValue="_id"
          />
        </div>
        <PropertyConfigOptions canBeFilter={canBeFilter} index={index} type={type} />
      </div>
    );
  }
}

FormConfigNewRelationshipComponent.defaultProps = {
  labelError: false,
  relationTypeError: false,
  showInheritOption: false,
  showInheritSelect: false,
  templateId: null,
  inheritSelectPropertyType: null,
};

FormConfigNewRelationshipComponent.propTypes = {
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

function mapStateToProps(state, props) {
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

export const FormConfigNewRelationship = connect(
  mapStateToProps,
  mapDispatchToProps
)(FormConfigNewRelationshipComponent);
