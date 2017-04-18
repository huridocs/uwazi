import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

export default class DatePicker extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    if (props.value) {
      this.state.value = moment.utc(props.value, 'X');
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.setState({value: moment.utc(newProps.value, 'X')});
    }
  }

  onChange(value) {
    this.setState({value});
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
    return (
        <DatePickerComponent
          dateFormat="MMM DD, YYYY"
          className="form-control"
          onChange={this.onChange.bind(this)}
          selected={this.state.value}
          locale='en-gb'
          isClearable={true}
          fixedHeight
          showYearDropdown
        />
    );
  }

}

DatePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  endOfDay: PropTypes.bool
};
