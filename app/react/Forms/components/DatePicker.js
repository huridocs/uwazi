import 'react-datepicker/dist/react-datepicker.css';

import DatePickerComponent from 'react-datepicker';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';

export default class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    if (props.value) {
      this.state.value = moment.utc(props.value, 'X').toDate();
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.setState({ value: moment.utc(newProps.value, 'X').toDate() });
    }
  }

  onChange(_value) {
    const { onChange, endOfDay } = this.props;
    this.setState({ value: _value });
    if (!_value) {
      return onChange(null);
    }
    const value = moment.utc(_value, 'X');
    this.setState({ value: value.toDate() });

    value.add(value.utcOffset(), 'minute');
    if (endOfDay) {
      value.utc().endOf('day');
    }

    onChange(parseInt(value.utc().format('X'), 10));
  }

  render() {
    const { locale, format, showTimeSelect } = this.props;
    return (
      <DatePickerComponent
        dateFormat={format}
        className="form-control"
        onChange={this.onChange.bind(this)}
        selected={this.state.value}
        locale={locale}
        placeholderText={format}
        isClearable
        fixedHeight
        showYearDropdown
        showTimeSelect={showTimeSelect}
        timeFormat="HH:mm"
        timeIntervals={15}
      />
    );
  }
}

DatePicker.defaultProps = {
  showTimeSelect: false,
  endOfDay: false,
  locale: 'en',
  format: 'dd/MM/yyyy',
};

DatePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  endOfDay: PropTypes.bool,
  showTimeSelect: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string
};
