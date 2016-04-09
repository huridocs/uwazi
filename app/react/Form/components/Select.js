import React, {Component, PropTypes} from 'react';
import ID from 'app/utils/uniqueID';

export class Select extends Component {

  render() {
    const {properties, label, options} = this.props;
    return (
      <div className="form-group">
        <label>{label}</label>
        <select className="form-control" {...properties}>
        {options.map((option) => {
          return <option key={ID()} value={option.value}>{option.label}</option>;
        })}
        </select>
      </div>
    );
  }

}

Select.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string,
  options: PropTypes.array
};

export default Select;
