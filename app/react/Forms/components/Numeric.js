/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class Numeric extends Component {
  onChange(e) {
    const { value } = e.target;
    const { onChange } = this.props;

    const numericValue = value !== '' ? parseFloat(value) : '';
    return onChange(numericValue);
  }

  render() {
    const { value } = this.props;
    return (
      <input
        type="number"
        step="any"
        className="form-control"
        onChange={this.onChange.bind(this)}
        value={value}
      />
    );
  }
}

Numeric.defaultProps = {
  value: '',
};

Numeric.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
};
