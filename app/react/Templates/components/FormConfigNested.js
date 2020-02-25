import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { setNestedProperties } from 'app/Templates/actions/templateActions';
import { Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'UI';
import ViolatedArticlesNestedProperties from './ViolatedArticlesNestedProperties';
import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigNested extends Component {
  constructor(props) {
    super(props);
    props.setNestedProperties(props.index, Object.keys(ViolatedArticlesNestedProperties));
  }

  contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type } = this.props;
    const property = data.properties[index];

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className={labelClass}>
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>

        <Field model={`template.data.properties[${index}].required`}>
          <input id={`required${this.props.index}`} type="checkbox" />
          &nbsp;
          <label className="property-label" htmlFor={`required${this.props.index}`}>
            Required property
            <span className="property-help">
              <Icon icon="question-circle" />
              <div className="property-description">
                You won&#39;t be able to publish a document if this property is empty.
              </div>
            </span>
          </label>
        </Field>
        <PropertyConfigOptions index={index} property={property} type={type} />
      </div>
    );
  }
}

FormConfigNested.propTypes = {
  thesauris: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string,
  setNestedProperties: PropTypes.func,
  type: PropTypes.string.isRequired,
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    formState: state.template.formState,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ setNestedProperties }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FormConfigNested);
