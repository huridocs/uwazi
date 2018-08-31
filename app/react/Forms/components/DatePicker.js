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
      this.state.value = moment.utc(props.value, 'X');
    }
    this.onChange = this.onChange.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.setState({ value: moment.utc(newProps.value, 'X') });
    }
  }


  shouldComponentUpdate(nextProps) {
    const { nextValue = null } = nextProps;
    const { value = null } = this.props;
    return nextValue !== value;
  }

  onChange(value) {
    this.setState({ value });
    if (!value) {
      return this.props.onChange(null);
    }
    value.add(value.utcOffset(), 'minute');
    if (this.props.endOfDay) {
      value.utc().endOf('day');
    }

    this.props.onChange(parseInt(value.utc().format('X'), 10));
  }

  render() {
    const locale = this.props.locale || 'en';
    const format = this.props.format || 'DD/MM/YYYY';
    return (
      <DatePickerComponent
        dateFormat={format}
        className="form-control"
        onChange={this.onChange}
        selected={this.state.value}
        locale={locale}
        placeholderText={format}
        isClearable
        fixedHeight
        showYearDropdown
      />
    );
  }
}

DatePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  endOfDay: PropTypes.bool,
  locale: PropTypes.string,
  format: PropTypes.string
};
