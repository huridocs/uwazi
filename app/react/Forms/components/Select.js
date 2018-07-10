import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { advancedSort } from 'app/utils/advancedSort';

export default class Select extends Component {
  render() {
    const { options, optionsValue, optionsLabel, required, placeholder } = this.props;

    const sortRoot = options.reduce((memo, option) => memo && !option.options, true);

    const sortedOptions = sortRoot ? advancedSort(options, { property: optionsLabel }) : options;

    const disbaled = Boolean(required);
    return (
      <select className="form-control" onChange={this.props.onChange} value={this.props.value}>
        <option disbaled={disbaled.toString()} value="" >{placeholder}</option>;
        {sortedOptions.map((option, index) => {
          const key = option._id || option.id || index;
          if (option.options) {
            const groupOptions = advancedSort(option.options, { property: optionsLabel });
            return (
              <optgroup key={key} label={option.label}>
                {groupOptions.map((opt, indx) => {
                  const ky = opt._id || opt.id || indx;
                  return <option key={ky} value={opt[optionsValue]}>{opt[optionsLabel]}</option>;
                })}
              </optgroup>);
          }
          return <option key={key} value={option[optionsValue]}>{option[optionsLabel]}</option>;
        })}
      </select>
    );
  }
}

Select.defaultProps = {
  value: '',
  optionsValue: 'value',
  optionsLabel: 'label',
  placeholder: 'Select...',
  required: false
};

Select.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string,
  required: PropTypes.bool
};
