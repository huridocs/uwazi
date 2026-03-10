import { DateRange } from 'app/ReactReduxForms';
import PropTypes from 'prop-types';
import React from 'react';

const DateFilter = ({ onChange = () => {}, model, label = '', format = '' }) => (
  <ul className="search__filter is-active">
    <li>
      <label>{label}</label>
    </li>
    <li className="wide">
      <DateRange model={model} onChange={onChange} format={format} />
    </li>
  </ul>
);

DateFilter.propTypes = {
  model: PropTypes.string.isRequired,
  format: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
};

export default DateFilter;
