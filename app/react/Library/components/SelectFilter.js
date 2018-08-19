import PropTypes from 'prop-types';
import React from 'react';

import { MultiSelect, Switcher } from 'app/ReactReduxForms';

const SelectFilter = ({ onChange, model, label, options, prefix, showBoolSwitch }) => (
  <ul className="search__filter is-active">
    <li>
      {label}
      {showBoolSwitch && <Switcher model={`${model}.and`} prefix={prefix} onChange={onChange} />}
    </li>
    <li className="wide">
      <MultiSelect
        model={`${model}.values`}
        prefix={prefix}
        options={options}
        optionsValue="id"
        onChange={onChange}
      />
    </li>
  </ul>
);

SelectFilter.defaultProps = {
  onChange: () => {},
  label: '',
  prefix: '',
  showBoolSwitch: false,
};

SelectFilter.propTypes = {
  model: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  prefix: PropTypes.string,
  showBoolSwitch: PropTypes.bool,
  options: PropTypes.array.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.string
  ])
};

export default SelectFilter;
