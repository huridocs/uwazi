import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

export class Select extends Component {

  render() {
    let {options, optionsValue, optionsLabel} = this.props;
    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';
    let placeholder = this.props.placeholder || 'Select...';
    return (
        <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        {(() => {
          if (placeholder) {
            return <option value='' disabled>{placeholder}</option>;
          }
        })()}
        {options.map((option, index) => {
          if (option.options) {
            return <optgroup key={index} label={option.label}>
                    {option.options.map((opt, indx) => {
                      return <option key={indx} value={opt[optionsValue]}>{opt[optionsLabel]}</option>;
                    })}
                   </optgroup>;
          }
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
