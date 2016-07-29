import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import DatePickerComponent from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

export class DatePicker extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    if (props.value) {
      this.state.value = moment.utc(props.value, 'X');
    }
  }

  onChange(value) {
    if (this.props.endOfDay) {
      value.utc().endOf('day');
    }
    this.props.onChange(value.format('X'));
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value) {
      this.setState({value: moment.utc(newProps.value, 'X')});
    }
  }

  render() {
    return (
        <DatePickerComponent
          dateFormat="MMM DD, YYYY"
          className="form-control"
          onChange={this.onChange.bind(this)}
          selected={this.state.value}
          locale='en-gb'
          fixedHeight
          showYearDropdown
        />
    );
  }

}

DatePicker.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  endOfDay: PropTypes.bool
};

export default DatePicker;

const DatePickerField = createFieldClass({
  DatePicker: controls.text
});

export {DatePickerField};
