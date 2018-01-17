import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {advancedSort} from 'app/utils/advancedSort';

export default class Select extends Component {

  render() {
    let {options, optionsValue, optionsLabel} = this.props;

    optionsValue = optionsValue || 'value';
    optionsLabel = optionsLabel || 'label';

    let sortRoot = options.reduce((memo, option) => {
      return memo && !option.options;
    }, true);

    const sortedOptions = sortRoot ? advancedSort(options, {property: optionsLabel}) : options;

    let placeholder = this.props.placeholder || 'Select...';
    return (
        <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        {(() => {
          if (placeholder) {
            return <option value='' disabled selected>{placeholder}</option>;
          }
        })()}
        {sortedOptions.map((option, index) => {
          if (option.options) {
            const groupOptions = advancedSort(option.options, {property: optionsLabel});
            return <optgroup key={index} label={option.label}>
                    {groupOptions.map((opt, indx) => {
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
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string,
  autoAssign: PropTypes.bool
};
