import React, {Component, PropTypes} from 'react';
import DatePicker from './DatePicker';
import {t} from 'app/I18N';

export class DateRange extends Component {

  render() {
    return (
        <div>
          <div className="DatePicker__From">
            <span>{t('System', 'Label date "From"', 'Form:')}&nbsp;</span>
              <DatePicker model={`${this.props.model}.from`} onChange={this.props.fromChange}/>
          </div>
          <div className="DatePicker__To">
            <span>&nbsp;{t('System', 'Label date "to"', 'To:')}&nbsp;</span>
              <DatePicker model={`${this.props.model}.to`} endOfDay={true} onChange={this.props.toChange}/>
          </div>
        </div>
    );
  }

}

DateRange.propTypes = {
  model: PropTypes.string,
  fromChange: PropTypes.func,
  onChange: PropTypes.func,
  toChange: PropTypes.func
};

export default DateRange;
