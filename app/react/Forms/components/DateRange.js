import React, {Component, PropTypes} from 'react';

import DatePicker, {DatePickerField} from './DatePicker';

export class DateRange extends Component {

  render() {
    return (
        <div>
          <span>From:&nbsp;</span>
          <DatePickerField model={this.props.fromModel} >
            <DatePicker onChange={this.props.fromChange}/>
          </DatePickerField>
          <span>&nbsp;To:&nbsp;</span>
          <DatePickerField model={this.props.toModel} >
            <DatePicker endOfDay={true} onChange={this.props.toChange}/>
          </DatePickerField>
        </div>
    );
  }

}

DateRange.propTypes = {
  fromModel: PropTypes.string,
  toModel: PropTypes.string,
  fromChange: PropTypes.func,
  toChange: PropTypes.func
};

export default DateRange;
