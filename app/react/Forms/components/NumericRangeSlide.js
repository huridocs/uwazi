import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class NumericRangeSlide extends Component {
  static getDerivedStateFromProps({ value }) {
    if (value) {
      return { value };
    }

    return null;
  }

  constructor(props) {
    super(props);
    this.state = { value: props.value };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const { value } = e.target;
    this.setState({ value });
    const { delay, onChange } = this.props;
    if (delay) {
      clearTimeout(this.timeOut);
      this.timeOut = setTimeout(() => {
        onChange(value ? parseFloat(value) : null);
      }, delay);

      return;
    }

    onChange(value ? parseFloat(value) : null);
  }

  renderTickMarksDatalist() {
    const { min, max, step, prefix } = this.props;
    return (
      <datalist id={`${prefix}-tickmarks`}>
        <option value={min} />
        {(() => {
          const options = [];
          for (let i = min; i < max; i += step) {
            options.push(<option key={i} value={i.toFixed(2)} />);
          }
          return options;
        })()}
        <option value={max} />
      </datalist>
    );
  }

  render() {
    const { min, max, step, prefix, minLabel, maxLabel } = this.props;
    const { value } = this.state;
    return (
      <>
        <div className="NumericRangeSlide">
          <input
            type="range"
            list={`${prefix}-tickmarks`}
            min={min}
            max={max}
            step={step}
            onChange={this.onChange}
            value={value}
          />
          <div className="NumericRangeSlide-range-labels">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        </div>
        {this.renderTickMarksDatalist()}
      </>
    );
  }
}

NumericRangeSlide.defaultProps = {
  onChange: () => {},
  value: 50,
  step: 5,
  min: 0,
  max: 100,
  prefix: '',
  delay: 0,
  minLabel: '',
  maxLabel: '',
};

NumericRangeSlide.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number,
  step: PropTypes.number,
  min: PropTypes.number,
  delay: PropTypes.number,
  max: PropTypes.number,
  prefix: PropTypes.string,
  minLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  maxLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
