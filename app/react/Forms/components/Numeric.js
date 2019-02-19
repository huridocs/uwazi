import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class Numeric extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value || '' };
  }

  onChange(e) {
    const { value } = e.target;
    this.setState({ value });
    if (!value) {
      return this.props.onChange(null);
    }

    const numericValue = parseFloat(value);
    this.props.onChange(numericValue);
  }

  render() {
    return (
      <input
        className="form-control"
        onChange={this.onChange.bind(this)}
        value={this.state.value}
      />
    );
  }
}

Numeric.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any
};
