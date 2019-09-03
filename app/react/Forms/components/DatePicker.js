import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';

class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onChange = this.onChange.bind(this);
    if (props.value) {
      this.state.value = moment.utc(props.value, 'X');
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.setState({ value: moment.utc(newProps.value, 'X') });
    }
  }

  onChange(value) {
    const { onChange, endOfDay, useTimezone } = this.props;
    this.setState({ value });
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
    const { value } = this.state;

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
  onChange: () => {},
  value: undefined,
  endOfDay: false,
  locale: undefined,
  format: undefined,
  useTimezone: false
};

DatePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number,
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool
};

export default DatePicker;
