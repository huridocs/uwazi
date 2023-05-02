/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-pascal-case */
import { Control, Field, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
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
    const { index, type, labelError, inheritSelectPropertyType } = this.props;

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
          <label no-translate>Denormalized property</label>
          <Field model={`template.data.properties[${index}].denormalizedProperty`}>
            <input id="denormalizedProperty" className="form-control" />
          </Field>
        </div>
        <PropertyConfigOptions canBeFilter={canBeFilter} index={index} type={type} />
      </div>
    );
  }
}

FormConfigNewRelationshipComponent.defaultProps = {
  labelError: false,
  showInheritSelect: false,
  inheritSelectPropertyType: null,
};

FormConfigNewRelationshipComponent.propTypes = {
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  labelError: PropTypes.bool,
  showInheritSelect: PropTypes.bool,
  inheritSelectPropertyType: PropTypes.string,
  resetFormValue: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  const { template, templates, relationTypes } = state;

  return {
    labelError:
      template.formState.$form.errors[`properties.${props.index}.label.required`] ||
      template.formState.$form.errors[`properties.${props.index}.label.duplicated`],

    relationTypeError:
      template.formState.$form.errors[`properties.${props.index}.relationType.required`] &&
      template.formState.$form.submitFailed,
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
