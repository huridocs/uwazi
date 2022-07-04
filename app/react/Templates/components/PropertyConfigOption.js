import { Field } from 'react-redux-form';
import PropTypes from 'prop-types';
import React from 'react';
import { Translate } from 'app/I18N';

const PropertyConfigOption = ({ children, model, label }) => (
  <Field model={model}>
    <label className="property-label" htmlFor={`test${model}`}>
      <input id={`test${model}`} type="checkbox" />{' '}
      <Translate translationKey={label}>{label}</Translate>
    </label>
    {children}
  </Field>
);

PropertyConfigOption.defaultProps = {
  children: '',
};

PropertyConfigOption.propTypes = {
  children: PropTypes.node,
  model: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default PropertyConfigOption;
