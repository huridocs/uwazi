import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

export class Select extends Component {

  render() {
    const {options} = this.props;
    return (
        <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        {options.map((option, index) => {
          return <option key={index} value={option.value}>{option.label}</option>;
        })}
        </select>
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
