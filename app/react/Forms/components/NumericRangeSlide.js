import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class NumericRangeSlide extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
    this.onChange = this.onChange.bind(this);
  }

  componentWillReceiveProps({ value }) {
    if (value) {
      this.setState({ value });
    }
  }

  onChange(e) {
    const { value } = e.target;
    this.setState({ value });
    this.props.onChange(value ? parseFloat(value) : null);
  }

  render() {
    const { min, max, step } = this.props;
    return (
      <React.Fragment>
        <input
          type="range"
          list={`${this.props.prefix}-tickmarks`}
          min={min}
          max={max}
          step={step}
          onChange={this.onChange}
          value={this.state.value}
        />
        <datalist id={`${this.props.prefix}-tickmarks`}>
          <option value={min}/>
          {(() => {
          const options = [];
          for (let i = min * 2; i < max; i += step) {
            options.push(<option key={i} value={i}/>);
          }
          return options;
        })()}
          <option value={max}/>
        </datalist>
      </React.Fragment>
    );
  }
}

NumericRangeSlide.defaultProps = {
  onChange: () => {},
  value: 50,
  step: 5,
  min: 0,
  max: 100,
  prefix: ''
};

NumericRangeSlide.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number,
  step: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  prefix: PropTypes.string,
};
