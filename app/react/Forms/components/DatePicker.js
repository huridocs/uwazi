import { connect } from 'react-redux';
import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent, { registerLocale } from 'react-datepicker';
import * as localization from 'date-fns/locale';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment-timezone';

const removeOffset = (useTimezone, value) => {
  let datePickerValue = null;
  const miliseconds = value * 1000;
  if (value) {
    const newValue = moment.utc(miliseconds);

    if (!useTimezone) {
      // in order to get the system offset for the specific date we
      // need to create a new not UTC moment object with the original timestamp
      newValue.subtract(moment(moment(miliseconds)).utcOffset(), 'minutes');
    }

    datePickerValue = parseInt(newValue.locale('en').format('x'), 10);
  }

  return datePickerValue;
};

const addOffset = (useTimezone, endOfDay, value) => {
  const newValue = moment.utc(value);

  if (!useTimezone) {
    // in order to get the proper offset moment has to be initialized with the actual date
    // without this you always get the "now" moment offset
    newValue.add(moment(value).utcOffset(), 'minutes');
  }

  if (endOfDay) {
    const method = useTimezone ? newValue.local() : newValue.utc();
    method.endOf('day');
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
      onChange(parseInt(newValue.locale('en').format('X'), 10));
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
