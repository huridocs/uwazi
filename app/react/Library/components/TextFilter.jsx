import { Field } from 'react-redux-form';
import PropTypes from 'prop-types';
import React from 'react';

const TextFilter = ({ onChange, model, label }) => (
  <Field model={model}>
    <ul className="search__filter is-active">
      <li>
        <label>{label}</label>
      </li>
      <li className="wide">
        <input className="form-control" onChange={onChange} />
      </li>
    </ul>
  </Field>
);

TextFilter.defaultProps = {
  onChange: () => {},
  label: '',
};

TextFilter.propTypes = {
  model: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default TextFilter;
