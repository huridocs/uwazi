import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigInput extends Component {
  render() {
    const { index, property, formState, type, canBeFilter } = this.props;
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
          <label>Name</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>
        <PropertyConfigOptions
          index={index}
          property={property}
          type={type}
          canBeFilter={canBeFilter}
        />
      </div>
    );
  }
}

FormConfigInput.defaultProps = {
  canBeFilter: true,
};

FormConfigInput.propTypes = {
  canBeFilter: PropTypes.bool,
  property: PropTypes.instanceOf(Object).isRequired,
  index: PropTypes.number.isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  type: PropTypes.string.isRequired,
};

export function mapStateToProps({ template }, props) {
  return {
    property: template.data.properties[props.index],
    formState: template.formState,
  };
}

export default connect(mapStateToProps)(FormConfigInput);
