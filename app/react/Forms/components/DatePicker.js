import { connect } from 'react-redux';
import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';

const removeOffset = (useTimezone, value) => {
  let datePickerValue = null;
  if (value) {
    const newValue = moment.utc(value * 1000);

    if (!useTimezone) {
      newValue.subtract(moment().utcOffset(), 'minute');
    }

    datePickerValue = parseInt(newValue.locale('en').format('x'), 10);
  }

  return datePickerValue;
};

const addOffset = (useTimezone, endOfDay, value) => {
  const newValue = moment.utc(value);

  if (!useTimezone) {
    newValue.add(moment().utcOffset(), 'minute');
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
    let { locale, format } = this.props;
    const { useTimezone, value } = this.props;
    locale = locale || 'en';
    format = format || 'dd/MM/yyyy';

    const datePickerValue = removeOffset(useTimezone, value);

    return (
      <DatePickerComponent
        dateFormat={format}
        className="form-control"
        onChange={this.handleChange}
        selected={datePickerValue}
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
  value: PropTypes.number,
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default connect()(DatePicker);
