import React, {Component, PropTypes} from 'react';

export class Select extends Component {

  render() {
    let {properties, label, options, optionsValue, optionsLabel} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    return (
      <ul className="search__filter">
        <li><label>{label}</label></li>
        <li>
          <select className="form-control" {...properties}>
            {options.map((option, index) => {
              return <option key={index} value={option[optionsValue]}>{option[optionsLabel]}</option>;
            })}
          </select>
        </li>
      </ul>
    );
  }

}

Select.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string,
  options: PropTypes.array,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string
};

export default Select;
