import React, { Component, PropTypes } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

class DatepickerField extends Component {

  value = () => {
    return this.field.value
  };

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="label">{this.props.label}</label>
        <DatePicker className="form-control" ref={(ref) => {this.field = ref}}/>
      </div>
    )
  };

}
export default DatepickerField;
