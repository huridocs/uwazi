/** @format */

import { advancedSort } from 'app/utils/advancedSort';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';
export default class Select extends Component {
  render() {
    const { options, optionsValue, optionsLabel, placeholder, sort } = this.props;

    let _options = options;
    if (sort) {
      const sortRoot = options.reduce((memo, option) => memo && !option.options, true);
      _options = sortRoot ? advancedSort(options, { property: optionsLabel }) : options;
    }
    const { value } = this.props;

    return (
      <select className="form-control" onChange={this.props.onChange} value={value}>
        `<option value="">{t('System', placeholder, null, false)}</option>`;
        {_options.map((option, index) => {
          const key = option._id || option.id || index;
          if (option.options) {
            const groupOptions = sort
              ? advancedSort(option.options, { property: optionsLabel })
              : option.options;
            return (
              <optgroup key={key} label={option.label}>
                {groupOptions.map((opt, indx) => {
                  const ky = opt._id || opt.id || indx;
                  return (
                    <option key={ky} value={opt[optionsValue]}>
                      {opt[optionsLabel]}
                    </option>
                  );
                })}
              </optgroup>
            );
          }
          return (
            <option key={key} value={option[optionsValue]}>
              {option[optionsLabel]}
            </option>
          );
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
  sort: false,
};

Select.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  optionsValue: PropTypes.string,
  optionsLabel: PropTypes.string,
  sort: PropTypes.bool,
};
