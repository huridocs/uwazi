import React, {Component, PropTypes} from 'react';

import DatePicker, {DatePickerField} from './DatePicker';
import {t} from 'app/I18N';

export class DateRange extends Component {

  render() {
    return (
        <div>
          <div className="DatePicker__From">
            <span>{t('System', 'Label fecha "From"')}&nbsp;</span>
            <DatePickerField model={this.props.fromModel} >
              <DatePicker onChange={this.props.fromChange}/>
            </DatePickerField>
          </div>
          <div className="DatePicker__To">
            <span>&nbsp;{t('System', 'Label fecha "From"')}&nbsp;</span>
            <DatePickerField model={this.props.toModel} >
              <DatePicker endOfDay={true} onChange={this.props.toChange}/>
            </DatePickerField>
          </div>
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
