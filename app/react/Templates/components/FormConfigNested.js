import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { setNestedProperties } from 'app/Templates/actions/templateActions';
import { Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'UI';
import ViolatedArticlesNestedProperties from './ViolatedArticlesNestedProperties';
import PropertyConfigOptions from './PropertyConfigOptions';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

export class FormConfigNested extends Component {
  constructor(props) {
    super(props);
    props.setNestedProperties(props.index, Object.keys(ViolatedArticlesNestedProperties));
  }

  contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  render() {
    const { index, type, labelHasError } = this.props;

    return (
      <div>
        <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
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
                You won&#39;t be able to publish an entity if this property is empty.
              </div>
            </span>
          </label>
        </Field>
        <PropertyConfigOptions index={index} type={type} />
      </div>
    );
  }
}

FormConfigNested.defaultProps = {
  labelHasError: false,
};

FormConfigNested.propTypes = {
  thesauris: PropTypes.object,
  index: PropTypes.number,
  formKey: PropTypes.string,
  setNestedProperties: PropTypes.func,
  type: PropTypes.string.isRequired,
  labelHasError: PropTypes.bool,
};

export function mapStateToProps(state, props) {
  return {
    labelHasError: checkErrorsOnLabel(state, props),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ setNestedProperties }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FormConfigNested);
