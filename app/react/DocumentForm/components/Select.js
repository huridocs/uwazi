import React, {Component, PropTypes} from 'react';
import { createFieldClass, controls } from 'react-redux-form';

export class Select extends Component {

  render() {
    const {label, options} = this.props;
    return (
      <div className="form-group">
        <label>{label}</label>
        <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        {options.map((option, index) => {
          return <option key={index} value={option.value}>{option.label}</option>;
        })}
        </select>
      </div>
    );
  }

}

Select.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.string
};

export default Select;

const SelectField = createFieldClass({
  Select: controls.select
});

export {SelectField};
