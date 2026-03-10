import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import DatePicker from './DatePicker';

class DateRange extends Component {
  onChange(prop, propValue) {
    const { value, onChange } = this.props;
    const state = { ...value, [prop]: propValue };

    onChange(state);
  }

  render() {
    const { useTimezone, locale, format } = this.props;
    const { value } = this.props;
    const { from: stateFrom, to: stateTo } = value || { from: null, to: null };

    return (
      <div>
        <div className="DatePicker__From">
          <span className="truncate">
            <Translate translationKey='Label date "From"'>From:</Translate>
          </span>
          <DatePicker
            locale={locale}
            format={format}
            useTimezone={useTimezone}
            value={stateFrom}
            onChange={val => this.onChange('from', val)}
          />
        </div>
        <div className="DatePicker__To">
          <span className="truncate">
            <Translate translationKey='Label date "to"'>To:</Translate>
          </span>
          <DatePicker
            locale={locale}
            format={format}
            useTimezone={useTimezone}
            value={stateTo}
            endOfDay
            onChange={val => this.onChange('to', val)}
          />
        </div>
      </div>
    );
  }
}

DateRange.defaultProps = {
  value: { from: null, to: null },
  onChange: () => {},
  locale: undefined,
  format: undefined,
  useTimezone: false,
};

DateRange.propTypes = {
  value: PropTypes.shape({ from: PropTypes.number, to: PropTypes.number }),
  onChange: PropTypes.func,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default DateRange;
