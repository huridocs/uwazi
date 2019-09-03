import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';
import DatePicker from './DatePicker';

class DateRange extends Component {
  constructor(props) {
    super(props);
    const value = props.value || {};
    this.state = { from: value.from, to: value.to };
  }

  onChange(prop, value) {
    const { onChange } = this.props;
    const state = Object.assign({}, this.state);
    state[prop] = value;
    this.setState(state);
    onChange(state);
  }

  render() {
    const { useTimezone } = this.props;
    let { locale, format } = this.props;
    locale = locale || 'en';
    format = format || 'DD/MM/YYYY';
    const { from: stateFrom, to: stateTo } = this.state;

    return (
      <div>
        <div className="DatePicker__From">
          <span>{t('System', 'Label date "From"', 'From:')}&nbsp;</span>
          <DatePicker
            locale={locale}
            format={format}
            useTimezone={useTimezone}
            value={stateFrom}
            onChange={val => this.onChange('from', val)}
          />
        </div>
        <div className="DatePicker__To">
          <span>&nbsp;{t('System', 'Label date "to"', 'To:')}&nbsp;</span>
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
  value: {},
  onChange: () => {},
  locale: undefined,
  format: undefined,
  useTimezone: false
};

DateRange.propTypes = {
  value: PropTypes.shape({ from: PropTypes.number, to: PropTypes.number }),
  onChange: PropTypes.func,
  locale: PropTypes.string,
  format: PropTypes.string,
  useTimezone: PropTypes.bool,
};

export default DateRange;
