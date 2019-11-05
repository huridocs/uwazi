/** @format */

import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import { AllowMoType, UnwrapMetadataObject } from './MetadataUtil';

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(value) {
    const { endOfDay, useTimezone } = this.props;
    const { onChange } = UnwrapMetadataObject(this.props);
    if (!value) {
      onChange(null);
    } else {
      if (!useTimezone) {
        value.add(value.utcOffset(), 'minute');
      }

      if (endOfDay) {
        const method = useTimezone ? value : value.utc();
        method.endOf('day');
      }

      onChange(parseInt(value.utc().format('X'), 10));
    }
  }

  render() {
    let { locale, format } = this.props;
    locale = locale || 'en';
    format = format || 'DD/MM/YYYY';
    let { value } = UnwrapMetadataObject(this.props);
    value = value ? moment.utc(value, 'X') : null;

    return (
      <DatePickerComponent
        dateFormat={format}
        className="form-control"
        onChange={this.onChange}
        selected={value}
        locale={locale}
        placeholderText={format}
        isClearable
        fixedHeight
        showYearDropdown
      />
    );
  }
}

DatePicker.defaultProps = {
  value: undefined,
  endOfDay: false,
  locale: undefined,
  format: undefined,
  useTimezone: false,
};

DatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: AllowMoType(PropTypes.number),
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default DatePicker;
