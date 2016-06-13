import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

export class Select extends Component {

  render() {
    let {options, optionsValue, optionsLabel, placeholder} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    return (
        <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        {(() => {
          if (placeholder) {
            return <option value='' disabled>{placeholder}</option>;
          }
        })()}
        {options.map((option, index) => {
          return <option key={index} value={option[optionsValue]}>{option[optionsLabel]}</option>;
        })}
        </select>
    );
  }

}

Select.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string
};

export default Select;

const SelectField = createFieldClass({
  Select: controls.select
});

export {SelectField};
