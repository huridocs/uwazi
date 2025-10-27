import { connect } from 'react-redux';
import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent, { registerLocale } from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DateTime, Info } from 'luxon';

// Create react-datepicker compatible locale objects using Luxon
const createLocaleFromLuxon = localeCode => {
  const locale = localeCode || 'en';

  return {
    localize: {
      month: n => Info.months('long', { locale })[n],
      day: n => Info.weekdays('long', { locale })[n],
    },
    formatLong: {
      date: () => 'MM/dd/yyyy',
    },
    options: {
      weekStartsOn: Info.getStartOfWeek({ locale }) - 1, // Luxon: 1-7, react-datepicker: 0-6
    },
  };
};

const removeOffset = (useTimezone, value) => {
  let datePickerValue = null;
  const miliseconds = value * 1000;
  if (value) {
    let newValue = DateTime.fromMillis(miliseconds, { zone: 'utc' });

    if (!useTimezone) {
      // in order to get the system offset for the specific date we
      // need to create a new not UTC DateTime object with the original timestamp
      const localOffset = DateTime.fromMillis(miliseconds).offset;
      newValue = newValue.minus({ minutes: localOffset });
    }

    datePickerValue = parseInt(newValue.toMillis().toString(), 10);
  }

  return datePickerValue;
};

const addOffset = (useTimezone, endOfDay, value) => {
  let newValue = DateTime.fromJSDate(value, { zone: 'utc' });

  if (!useTimezone) {
    // in order to get the proper offset DateTime has to be initialized with the actual date
    // without this you always get the "now" DateTime offset
    const localOffset = DateTime.fromJSDate(value).offset;
    newValue = newValue.plus({ minutes: localOffset });
  }

  if (endOfDay) {
    newValue = useTimezone ? newValue.setZone('local').endOf('day') : newValue.endOf('day');
  }

  return newValue;
};

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    registerLocale(props.locale || 'en', createLocaleFromLuxon(props.locale));
  }

  handleChange(datePickerValue) {
    const { endOfDay, useTimezone, onChange } = this.props;

    if (!datePickerValue) {
      onChange(null);
    } else {
      const newValue = addOffset(useTimezone, endOfDay, datePickerValue);
      onChange(Math.floor(newValue.toSeconds()));
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
