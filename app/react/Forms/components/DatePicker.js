import { connect } from 'react-redux';
import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent, { registerLocale } from 'react-datepicker';
import * as localization from 'date-fns/locale';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { endOfDay as dateEndOfDay, getUnixTime } from 'date-fns';

const removeOffset = (useTimezone, value) => {
  let datePickerValue = null;
  const miliseconds = value * 1000;
  if (value) {
    let newValue = new Date(miliseconds);

    if (!useTimezone) {
      // in order to get the system offset for the specific date we
      // need to create a new not UTC Date object with the original timestamp
      const offsetMinutes = new Date(miliseconds).getTimezoneOffset();
      newValue = new Date(miliseconds + offsetMinutes * 60 * 1000);
    }

    datePickerValue = newValue.getTime();
  }

  return datePickerValue;
};

const addOffset = (useTimezone, endOfDay, value) => {
  let newValue = new Date(value);

  if (!useTimezone) {
    // in order to get the proper offset we need to use the actual date
    // without this you always get the "now" offset
    const offsetMinutes = new Date(value).getTimezoneOffset();
    newValue = new Date(value - offsetMinutes * 60 * 1000);
  }

  if (endOfDay) {
    newValue = dateEndOfDay(newValue);
  }

  return newValue;
};

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    registerLocale(props.locale || 'en', localization[props.locale] || localization.enGB);
  }

  handleChange(datePickerValue) {
    const { endOfDay, useTimezone, onChange } = this.props;

    if (!datePickerValue) {
      onChange(null);
    } else {
      const newValue = addOffset(useTimezone, endOfDay, datePickerValue);
      onChange(getUnixTime(newValue));
    }
  }

  render() {
    const { locale, format, useTimezone, value } = this.props;
    const defaultFormat = 'dd/MM/yyyy';
    const datePickerValue = removeOffset(useTimezone, value);
    return (
      <DatePickerComponent
        dateFormat={format || defaultFormat}
        className="form-control"
        onChange={this.handleChange}
        selected={datePickerValue}
        locale={locale}
        placeholderText={format || defaultFormat}
        popperProps={{ strategy: 'fixed' }}
        isClearable
        fixedHeight
        showYearDropdown
        dropdownMode="select"
      />
    );
  }
}

DatePicker.defaultProps = {
  value: undefined,
  endOfDay: false,
  locale: 'en',
  format: 'dd/MM/yyyy',
  useTimezone: false,
};

DatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number,
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default connect()(DatePicker);
