import React, {Component, PropTypes} from 'react';

export class Select extends Component {

  render() {
    const {properties, label, options} = this.props;
    return (
      <ul className="search__filter">
        <li><label>{label}</label></li>
        <li>
          <select className="form-control" {...properties}>
            {options.map((option, index) => {
              return <option key={index} value={option.value}>{option.label}</option>;
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
  options: PropTypes.array
};

export default Select;
