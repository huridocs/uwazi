import PropTypes from 'prop-types';
import React from 'react';
import { NumericRange } from 'app/ReactReduxForms';

const NumberRangeFilter = ({ onChange, model, label }) => (
  <ul className="search__filter is-active">
    <li>
      <label>{label}</label>
    </li>
    <li className="wide">
      <NumericRange model={model} onChange={onChange} />
    </li>
  </ul>
);

NumberRangeFilter.defaultProps = {
  onChange: () => {},
  label: '',
};

NumberRangeFilter.propTypes = {
  model: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default NumberRangeFilter;
