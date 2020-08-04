/** @format */

import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    const { endOfDay, useTimezone, onChange } = this.props;
    if (!value) {
      onChange(null);
    } else {
      const newValue = moment(value).utc();
      if (!useTimezone) {
        newValue.add(newValue.utcOffset(), 'minute');
      }

      if (endOfDay) {
        const method = useTimezone ? newValue : newValue.utc();
        method.endOf('day');
      }

      onChange(parseInt(newValue.format('X'), 10));
    }
  }

  componentWillReceiveProps(newProps) {
    console.log("rerender", newProps)
    console.log(newProps.value === this.props.value)
    Object.keys(newProps).forEach((key) => {
      if(newProps[key] !== this.props[key]) {
        console.log(key);
      }
    });
  }

  render() {
    console.log("render")
    let { locale, format } = this.props;
    locale = locale || 'en';
    format = format || 'dd/MM/yyyy';

    const value = this.props.value ? new Date().setTime(this.props.value * 1000) : null;

    return (
      <DatePickerComponent
        dateFormat={format}
        className="form-control"
        onChange={this.handleChange}
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
  value: PropTypes.number,
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default DatePicker;
